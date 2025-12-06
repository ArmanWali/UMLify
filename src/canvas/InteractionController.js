/**
 * InteractionController - Handles all canvas interactions
 * Implements State pattern for different tool modes
 */

import { EventBus, Events } from '../core/EventBus.js';
import { CommandManager } from '../core/CommandManager.js';
import { PluginRegistry } from '../core/PluginRegistry.js';
import { Point, snapToGrid } from '../utils/geometry.js';
import { ShapeFactory } from '../shapes/ShapeFactory.js';
import { Connection } from '../shapes/Connection.js';
import {
    AddShapeCommand,
    RemoveShapeCommand,
    MoveShapesCommand,
    AddConnectionCommand
} from '../commands/Commands.js';

export class InteractionController {
    constructor(canvas, diagram, selectionManager) {
        this.canvas = canvas;
        this.diagram = diagram;
        this.selectionManager = selectionManager;

        this.eventBus = EventBus.getInstance();
        this.commandManager = CommandManager.getInstance();
        this.pluginRegistry = PluginRegistry.getInstance();

        this.currentTool = 'select';
        this.state = 'idle'; // idle, dragging, connecting, drawing, resizing

        // Drag state
        this.dragStartPoint = null;
        this.dragOffset = null;
        this.isDragging = false;

        // Resize state
        this.isResizing = false;
        this.resizeHandle = null;
        this.resizeStartBounds = null;

        // Connection state
        this.connectionSource = null;
        this.connectionPreview = null;

        // Text editor reference (set from main.js)
        this.textEditor = null;

        this.init();
    }

    /**
     * Set the text editor reference
     */
    setTextEditor(textEditor) {
        this.textEditor = textEditor;
    }

    init() {
        // Listen for tool changes
        this.eventBus.on(Events.TOOL_SELECTED, this.handleToolSelected.bind(this));

        // Listen for canvas events
        this.eventBus.on(Events.CANVAS_CLICKED, this.handleCanvasClicked.bind(this));
        this.eventBus.on(Events.CANVAS_MOUSE_MOVE, this.handleCanvasMouseMove.bind(this));
        this.eventBus.on('canvas:dblclick', this.handleCanvasDoubleClick.bind(this));

        // Listen for drag-drop from toolbar
        this.eventBus.on('tool:dropped', this.handleToolDropped.bind(this));

        // Listen for shape events
        this.eventBus.on(Events.SHAPE_ADDED, this.handleShapeAdded.bind(this));

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Mouse up on document (for finishing drags)
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    /**
     * Handle tool dropped from toolbar via drag-drop
     */
    handleToolDropped({ toolId, toolType, x, y }) {
        const plugin = this.pluginRegistry.getActive();
        if (!plugin) return;

        // Get shape tools from plugin to validate it's a shape
        const shapeTools = plugin.getShapeTools();
        const shapeTool = shapeTools.find(t => t.id === toolId);

        // Also check shapeDefs (backward compatibility) or connector tools
        const shapeDefs = plugin.getShapeDefinitions();
        const connectorTypes = plugin.getConnectorTypes();
        const isConnector = connectorTypes.some(c => c.type === toolId);

        // Don't process connector drops (they need click-based connection)
        if (isConnector) return;

        // Create shape if valid shape tool or shape definition exists
        if (shapeTool || shapeDefs[toolId]) {
            const snappedX = snapToGrid(x, 20);
            const snappedY = snapToGrid(y, 20);

            // Get default sizes - check ShapeFactory first, then shapeDefs
            let defaultWidth = 100;
            let defaultHeight = 60;

            if (shapeDefs[toolId]) {
                defaultWidth = shapeDefs[toolId].defaultWidth || 100;
                defaultHeight = shapeDefs[toolId].defaultHeight || 60;
            } else if (ShapeFactory.has(toolId)) {
                // ShapeFactory has defaults registered for this type
                const tempShape = ShapeFactory.create(toolId, { x: 0, y: 0 });
                defaultWidth = tempShape.width || 100;
                defaultHeight = tempShape.height || 60;
            }

            const shape = ShapeFactory.create(toolId, {
                x: snappedX - defaultWidth / 2,
                y: snappedY - defaultHeight / 2,
                width: defaultWidth,
                height: defaultHeight,
                diagramType: plugin.id
            });

            const command = new AddShapeCommand(this.diagram, shape);
            this.commandManager.execute(command);

            // Select the new shape
            this.selectionManager.selectShape(shape);
        }
    }

    handleToolSelected({ toolId }) {
        this.currentTool = toolId;
        this.resetState();

        // Update cursor
        switch (toolId) {
            case 'select':
                this.canvas.setCursor('select');
                break;
            case 'pan':
                this.canvas.setCursor('pan');
                break;
            case 'delete':
                this.canvas.setCursor('not-allowed');
                break;
            default:
                this.canvas.setCursor('crosshair');
        }
    }

    handleCanvasClicked({ point, target, shiftKey, ctrlKey, originalEvent }) {
        const svgPoint = point;

        switch (this.currentTool) {
            case 'select':
                this.handleSelectClick(svgPoint, target, shiftKey, ctrlKey, originalEvent);
                break;
            case 'delete':
                this.handleDeleteClick(svgPoint, target);
                break;
            default:
                // Check if it's a shape or connector tool
                const plugin = this.pluginRegistry.getActive();
                if (plugin) {
                    const shapeDefs = plugin.getShapeDefinitions();
                    const connectorTypes = plugin.getConnectorTypes();

                    if (shapeDefs[this.currentTool]) {
                        this.handleShapeToolClick(svgPoint);
                    } else if (connectorTypes.find(c => c.type === this.currentTool)) {
                        this.handleConnectorToolClick(svgPoint, target);
                    }
                }
        }
    }

    handleSelectClick(point, target, shiftKey, ctrlKey, originalEvent) {
        // Check for resize handle click first
        const resizeHandle = target.closest('.resize-handle');
        if (resizeHandle) {
            const handleId = resizeHandle.dataset.handle;
            const shapeId = resizeHandle.closest('.resize-handles')?.dataset.shapeId;
            const shape = shapeId ? this.diagram.getShape(shapeId) : this.selectionManager.getPrimarySelection();

            if (shape && handleId) {
                this.startResize(shape, handleId, point);
                return;
            }
        }

        // Find what was clicked
        const shapeElement = target.closest('.shape');
        const connectorElement = target.closest('.connector');

        if (shapeElement) {
            const shapeId = shapeElement.dataset.id;
            const shape = this.diagram.getShape(shapeId);

            if (shape) {
                if (shiftKey || ctrlKey) {
                    // Add to / toggle selection
                    this.selectionManager.toggleShape(shape);
                } else {
                    this.selectionManager.selectShape(shape);
                }

                // Start drag
                this.startDrag(point, originalEvent);
            }
        } else if (connectorElement) {
            const connId = connectorElement.dataset.id;
            const connection = this.diagram.getConnection(connId);
            if (connection) {
                this.selectionManager.selectConnection(connection);
            }
        } else {
            // Clicked on empty canvas - clear selection
            if (!shiftKey && !ctrlKey) {
                this.selectionManager.clearSelection();
            }
        }
    }

    /**
     * Start resizing a shape
     */
    startResize(shape, handleId, point) {
        this.isResizing = true;
        this.state = 'resizing';
        this.resizeHandle = handleId;
        this.resizeStartBounds = {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height
        };
        this.dragStartPoint = new Point(point.x, point.y);
        this.resizingShape = shape;

        // Set appropriate cursor
        const cursorMap = {
            'nw': 'nwse-resize', 'ne': 'nesw-resize',
            'sw': 'nesw-resize', 'se': 'nwse-resize',
            'n': 'ns-resize', 's': 'ns-resize',
            'e': 'ew-resize', 'w': 'ew-resize'
        };
        this.canvas.setCursor(cursorMap[handleId] || 'move');
    }

    /**
     * Handle resize dragging
     */
    doResize(point) {
        if (!this.resizingShape || !this.dragStartPoint) return;

        const dx = point.x - this.dragStartPoint.x;
        const dy = point.y - this.dragStartPoint.y;

        const newBounds = this.calculateNewBounds(
            this.resizeStartBounds,
            this.resizeHandle,
            dx, dy
        );

        // Apply new bounds
        this.resizingShape.x = newBounds.x;
        this.resizingShape.y = newBounds.y;
        this.resizingShape.width = newBounds.width;
        this.resizingShape.height = newBounds.height;
        this.resizingShape.updateElement();

        // Update connections
        this.diagram.getConnections().forEach(conn => conn.updateElement());

        // Emit update for handle repositioning
        this.eventBus.emit(Events.SHAPE_UPDATED, { shape: this.resizingShape });
    }

    /**
     * End resizing
     */
    endResize() {
        this.isResizing = false;
        this.state = 'idle';
        this.resizeHandle = null;
        this.resizeStartBounds = null;
        this.resizingShape = null;
        this.canvas.setCursor('select');
    }

    /**
     * Calculate new bounds based on handle drag
     */
    calculateNewBounds(original, handleId, dx, dy) {
        let { x, y, width, height } = original;

        switch (handleId) {
            case 'nw':
                x += dx; y += dy;
                width -= dx; height -= dy;
                break;
            case 'n':
                y += dy; height -= dy;
                break;
            case 'ne':
                y += dy;
                width += dx; height -= dy;
                break;
            case 'e':
                width += dx;
                break;
            case 'se':
                width += dx; height += dy;
                break;
            case 's':
                height += dy;
                break;
            case 'sw':
                x += dx;
                width -= dx; height += dy;
                break;
            case 'w':
                x += dx; width -= dx;
                break;
        }

        // Enforce minimum size
        const minW = 40, minH = 30;
        if (width < minW) { if (handleId.includes('w')) x -= (minW - width); width = minW; }
        if (height < minH) { if (handleId.includes('n')) y -= (minH - height); height = minH; }

        return { x, y, width, height };
    }

    handleDeleteClick(point, target) {
        const shapeElement = target.closest('.shape');
        if (shapeElement) {
            const shapeId = shapeElement.dataset.id;
            const shape = this.diagram.getShape(shapeId);
            if (shape) {
                const command = new RemoveShapeCommand(this.diagram, shape);
                this.commandManager.execute(command);
            }
        }
    }

    handleShapeToolClick(point) {
        // Create shape at clicked position (snapped to grid)
        const snappedPoint = new Point(
            snapToGrid(point.x, 20),
            snapToGrid(point.y, 20)
        );

        const plugin = this.pluginRegistry.getActive();
        const shapeDef = plugin.getShapeDefinitions()[this.currentTool];

        if (shapeDef) {
            const shape = ShapeFactory.create(this.currentTool, {
                x: snappedPoint.x - shapeDef.defaultWidth / 2,
                y: snappedPoint.y - shapeDef.defaultHeight / 2,
                width: shapeDef.defaultWidth,
                height: shapeDef.defaultHeight,
                diagramType: plugin.id
            });

            const command = new AddShapeCommand(this.diagram, shape);
            this.commandManager.execute(command);

            // Select the new shape
            this.selectionManager.selectShape(shape);

            // Switch to select tool
            this.eventBus.emit(Events.TOOL_SELECTED, { toolId: 'select' });
        }
    }

    handleConnectorToolClick(point, target) {
        const shapeElement = target.closest('.shape');

        if (!shapeElement) {
            // Clicked on empty space - cancel connection
            this.resetConnectionState();
            return;
        }

        const shapeId = shapeElement.dataset.id;
        const shape = this.diagram.getShape(shapeId);

        if (!shape) return;

        if (!this.connectionSource) {
            // Start connection
            this.connectionSource = shape;
            this.state = 'connecting';

            // Show connection preview tooltip
            const preview = document.getElementById('connection-preview');
            if (preview) preview.style.display = 'block';

        } else if (this.connectionSource.id !== shape.id) {
            // Complete connection
            const plugin = this.pluginRegistry.getActive();
            const validationResult = plugin.validateConnection(this.connectionSource, shape, this.currentTool);

            // Handle both boolean (true) and object ({valid: true}) return types
            const isValid = validationResult === true || (validationResult && validationResult.valid);

            if (isValid) {
                const connection = new Connection({
                    type: this.currentTool,
                    sourceId: this.connectionSource.id,
                    targetId: shape.id,
                    diagramType: plugin.id
                });

                // Set connection endpoints from source/target shapes
                connection.sourceShape = this.connectionSource;
                connection.targetShape = shape;

                const command = new AddConnectionCommand(this.diagram, connection);
                this.commandManager.execute(command);
            } else {
                const message = validationResult?.message || 'Invalid connection';
                console.warn('Invalid connection:', message);
            }

            this.resetConnectionState();
        }
    }

    handleCanvasMouseMove({ point, target }) {
        if (this.isDragging && this.state === 'dragging') {
            this.doDrag(point);
        }

        // Handle resize dragging
        if (this.isResizing && this.state === 'resizing') {
            this.doResize(point);
        }

        if (this.state === 'connecting' && this.connectionSource) {
            // Draw/update connection preview line from source to mouse
            this.updateConnectionPreview(point);

            // Highlight potential target shapes
            const shapeElement = target.closest('.shape');
            if (shapeElement && shapeElement.dataset.id !== this.connectionSource.id) {
                shapeElement.classList.add('shape--connecting');
            }
        }
    }

    /**
     * Update the connection preview line during connector creation
     */
    updateConnectionPreview(mousePoint) {
        const interactionLayer = this.canvas.getInteractionLayer();

        // Get or create preview line
        let previewLine = interactionLayer.querySelector('.connection-preview-line');
        if (!previewLine) {
            previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            previewLine.setAttribute('class', 'connection-preview-line connection-line-preview');
            interactionLayer.appendChild(previewLine);
        }

        // Get source shape center
        const sourceCenter = this.connectionSource.getBounds().center;

        previewLine.setAttribute('x1', sourceCenter.x);
        previewLine.setAttribute('y1', sourceCenter.y);
        previewLine.setAttribute('x2', mousePoint.x);
        previewLine.setAttribute('y2', mousePoint.y);
    }

    /**
     * Remove connection preview line
     */
    removeConnectionPreview() {
        const interactionLayer = this.canvas.getInteractionLayer();
        const previewLine = interactionLayer.querySelector('.connection-preview-line');
        if (previewLine) {
            previewLine.remove();
        }

        // Remove highlighting from all shapes
        document.querySelectorAll('.shape--connecting').forEach(el => {
            el.classList.remove('shape--connecting');
        });
    }

    handleCanvasDoubleClick({ point, target }) {
        const shapeElement = target.closest('.shape');
        if (shapeElement) {
            const shapeId = shapeElement.dataset.id;
            const shape = this.diagram.getShape(shapeId);

            if (shape && this.textEditor) {
                this.textEditor.startEditing(shape, 'name');
            }
        }
    }

    startDrag(point, originalEvent) {
        if (this.selectionManager.getSelectedShapes().length === 0) return;

        this.isDragging = true;
        this.state = 'dragging';
        this.dragStartPoint = point.clone ? point.clone() : new Point(point.x, point.y);

        this.canvas.setCursor('move');
    }

    doDrag(point) {
        if (!this.dragStartPoint) return;

        const dx = point.x - this.dragStartPoint.x;
        const dy = point.y - this.dragStartPoint.y;

        // Move selected shapes (visual only, command on mouse up)
        this.selectionManager.getSelectedShapes().forEach(shape => {
            shape.move(dx, dy);
        });

        // Update connections
        this.diagram.getConnections().forEach(conn => conn.updateElement());

        this.dragStartPoint = point.clone ? point.clone() : new Point(point.x, point.y);
    }

    handleMouseUp(e) {
        if (this.isDragging && this.state === 'dragging') {
            this.endDrag();
        }
        if (this.isResizing && this.state === 'resizing') {
            this.endResize();
        }
    }

    endDrag() {
        // Note: For proper undo, we should record the total delta from start
        // For now, just end the drag state
        this.isDragging = false;
        this.state = 'idle';
        this.dragStartPoint = null;

        if (this.currentTool === 'select') {
            this.canvas.setCursor('select');
        }
    }

    handleKeyDown(e) {
        // Delete selected
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selectedShapes = this.selectionManager.getSelectedShapes();
            selectedShapes.forEach(shape => {
                const command = new RemoveShapeCommand(this.diagram, shape);
                this.commandManager.execute(command);
            });
            this.selectionManager.clearSelection();
        }

        // Undo
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            if (e.shiftKey) {
                this.commandManager.redo();
            } else {
                this.commandManager.undo();
            }
            e.preventDefault();
        }

        // Redo (Ctrl+Y)
        if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
            this.commandManager.redo();
            e.preventDefault();
        }

        // Escape - cancel current action
        if (e.key === 'Escape') {
            this.resetState();
            this.selectionManager.clearSelection();
        }

        // Tool shortcuts
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case 'v':
                    this.eventBus.emit(Events.TOOL_SELECTED, { toolId: 'select' });
                    break;
                case 'h':
                    this.eventBus.emit(Events.TOOL_SELECTED, { toolId: 'pan' });
                    break;
            }
        }
    }

    handleKeyUp(e) {
        // Handle key up if needed
    }

    handleShapeAdded({ shape }) {
        // Render the shape when added
        const plugin = this.pluginRegistry.getActive();
        if (plugin) {
            shape.render(this.canvas.getShapeLayer());
        } else {
            shape.render(this.canvas.getShapeLayer());
        }
    }

    resetState() {
        this.state = 'idle';
        this.isDragging = false;
        this.dragStartPoint = null;
        this.resetConnectionState();
    }

    resetConnectionState() {
        this.connectionSource = null;
        this.state = 'idle';

        // Remove preview line and tooltip
        this.removeConnectionPreview();

        const preview = document.getElementById('connection-preview');
        if (preview) preview.style.display = 'none';
    }
}
