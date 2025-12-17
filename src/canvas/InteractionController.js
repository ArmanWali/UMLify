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
    AddConnectionCommand,
    ResizeShapeCommand
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

        // Connection endpoint dragging state
        this.draggingEndpoint = null;
        this.draggingConnection = null;
        this.draggingEndpointType = null; // 'source' or 'target'

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

        // Check for connector endpoint click (for reconnection)
        const endpointHandle = target.closest('.connector__endpoint');
        if (endpointHandle) {
            const connectorElement = endpointHandle.closest('.connector');
            if (connectorElement) {
                const connId = connectorElement.dataset.id;
                const connection = this.diagram.getConnection(connId);
                if (connection) {
                    const isSource = endpointHandle.classList.contains('connector__endpoint--source');
                    this.startEndpointDrag(connection, isSource ? 'source' : 'target', point);
                    return;
                }
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
     * Start dragging a connector endpoint for reconnection
     */
    startEndpointDrag(connection, endpointType, point) {
        this.draggingEndpoint = true;
        this.state = 'dragging-endpoint';
        this.draggingConnection = connection;
        this.draggingEndpointType = endpointType;
        this.dragStartPoint = new Point(point.x, point.y);
        
        // Select the connection
        this.selectionManager.selectConnection(connection);
        
        this.canvas.setCursor('move');
    }

    /**
     * Handle endpoint dragging
     */
    doEndpointDrag(point, target) {
        if (!this.draggingConnection) return;

        // Update the endpoint position visually (preview)
        // The connection will snap to a shape when dropped
        
        // Highlight potential target shapes
        document.querySelectorAll('.shape--connecting').forEach(el => {
            el.classList.remove('shape--connecting');
        });
        
        const shapeElement = target.closest('.shape');
        if (shapeElement) {
            const shapeId = shapeElement.dataset.id;
            // Don't allow connecting to the other end's shape for the same connection
            const otherShapeId = this.draggingEndpointType === 'source' 
                ? this.draggingConnection.target.shapeId 
                : this.draggingConnection.source.shapeId;
            
            if (shapeId !== otherShapeId) {
                shapeElement.classList.add('shape--connecting');
            }
        }
    }

    /**
     * End endpoint dragging - reconnect to new shape if valid
     */
    endEndpointDrag(point, target) {
        if (!this.draggingConnection) return;

        const shapeElement = target?.closest('.shape');
        if (shapeElement) {
            const shapeId = shapeElement.dataset.id;
            const newShape = this.diagram.getShape(shapeId);
            
            if (newShape) {
                // Check it's not the same shape as the other endpoint
                const otherShapeId = this.draggingEndpointType === 'source' 
                    ? this.draggingConnection.target.shapeId 
                    : this.draggingConnection.source.shapeId;
                
                if (shapeId !== otherShapeId) {
                    // Reconnect
                    if (this.draggingEndpointType === 'source') {
                        this.draggingConnection.setSource(newShape, 'auto');
                    } else {
                        this.draggingConnection.setTarget(newShape, 'auto');
                    }
                }
            }
        }

        // Clean up
        document.querySelectorAll('.shape--connecting').forEach(el => {
            el.classList.remove('shape--connecting');
        });
        
        this.draggingEndpoint = false;
        this.state = 'idle';
        this.draggingConnection = null;
        this.draggingEndpointType = null;
        this.canvas.setCursor('select');
    }

    /**
     * End resizing - save the operation for undo/redo
     */
    endResize() {
        if (this.resizingShape && this.resizeStartBounds) {
            const newBounds = {
                x: this.resizingShape.x,
                y: this.resizingShape.y,
                width: this.resizingShape.width,
                height: this.resizingShape.height
            };
            
            // Only create command if bounds actually changed
            if (newBounds.x !== this.resizeStartBounds.x ||
                newBounds.y !== this.resizeStartBounds.y ||
                newBounds.width !== this.resizeStartBounds.width ||
                newBounds.height !== this.resizeStartBounds.height) {
                
                const command = new ResizeShapeCommand(
                    this.resizingShape,
                    { ...this.resizeStartBounds },
                    { ...newBounds }
                );
                // Don't execute since we already applied the changes visually
                // Just add to history for undo
                this.commandManager.addToHistory(command);
            }
        }
        
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
        
        // For sequence diagrams, also check if clicked on lifeline
        const lifelineElement = target.closest('.lifeline');

        if (!shapeElement && !lifelineElement) {
            // Clicked on empty space - cancel connection
            this.resetConnectionState();
            return;
        }

        // Get shape from either shape element or lifeline's parent
        let shape;
        if (shapeElement) {
            const shapeId = shapeElement.dataset.id;
            shape = this.diagram.getShape(shapeId);
        } else if (lifelineElement) {
            // Lifeline clicked - get parent shape
            const parentGroup = lifelineElement.closest('.shape');
            if (parentGroup) {
                const shapeId = parentGroup.dataset.id;
                shape = this.diagram.getShape(shapeId);
            }
        }

        if (!shape) return;

        const plugin = this.pluginRegistry.getActive();
        const isSequenceDiagram = plugin.id === 'sequence';

        if (!this.connectionSource) {
            // Start connection
            this.connectionSource = shape;
            this.connectionSourceY = point.y; // Store Y position for sequence diagrams
            this.state = 'connecting';

            // Show connection preview tooltip
            const preview = document.getElementById('connection-preview');
            if (preview) preview.style.display = 'block';

        } else if (this.connectionSource.id !== shape.id) {
            // Complete connection
            const validationResult = plugin.validateConnection(this.connectionSource, shape, this.currentTool);

            // Handle both boolean (true) and object ({valid: true}) return types
            const isValid = validationResult === true || (validationResult && validationResult.valid);

            if (isValid) {
                // Get connector types and find the current connector definition
                const connectorTypes = plugin.getConnectorTypes();
                const connectorDef = connectorTypes.find(c => c.type === this.currentTool);
                
                // For sequence diagrams, use the same Y for horizontal messages
                // or use specific Y positions for each endpoint
                const connectionOptions = {
                    type: this.currentTool,
                    sourceId: this.connectionSource.id,
                    targetId: shape.id,
                    diagramType: plugin.id,
                    style: {
                        lineStyle: connectorDef?.lineStyle || 'solid',
                        sourceArrow: connectorDef?.sourceArrow || 'none',
                        targetArrow: connectorDef?.targetArrow || 'filled'
                    }
                };

                // For sequence diagrams, add Y positions for lifeline connections
                if (isSequenceDiagram) {
                    // Use the target click Y position for both (horizontal message)
                    // This makes messages horizontal as expected in sequence diagrams
                    connectionOptions.sourceY = point.y;
                    connectionOptions.targetY = point.y;
                }

                const connection = new Connection(connectionOptions);

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

        // Handle endpoint dragging
        if (this.draggingEndpoint && this.state === 'dragging-endpoint') {
            this.doEndpointDrag(point, target);
        }

        if (this.state === 'connecting' && this.connectionSource) {
            // Draw/update connection preview line from source to mouse
            this.updateConnectionPreview(point);

            // Remove previous highlighting
            document.querySelectorAll('.shape--connecting').forEach(el => {
                el.classList.remove('shape--connecting');
            });
            document.querySelectorAll('.connection-point--active').forEach(el => {
                el.classList.remove('connection-point--active');
            });

            // Highlight potential target shapes and connection points
            const shapeElement = target.closest('.shape');
            if (shapeElement && shapeElement.dataset.id !== this.connectionSource.id) {
                shapeElement.classList.add('shape--connecting');
                
                // Highlight the nearest connection point
                const connectionPoint = target.closest('.connection-point');
                if (connectionPoint) {
                    connectionPoint.classList.add('connection-point--active');
                }
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
        
        // Store original positions for undo/redo
        this.dragStartPositions = this.selectionManager.getSelectedShapes().map(shape => ({
            shape,
            x: shape.x,
            y: shape.y
        }));

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
        if (this.draggingEndpoint && this.state === 'dragging-endpoint') {
            // Get target element under mouse
            const point = this.canvas.screenToSVG(e.clientX, e.clientY);
            const target = document.elementFromPoint(e.clientX, e.clientY);
            this.endEndpointDrag(point, target);
        }
    }

    endDrag() {
        // Create undo command for the total movement
        if (this.dragStartPositions && this.dragStartPositions.length > 0) {
            const shapes = this.dragStartPositions.map(p => p.shape);
            
            // Calculate total delta from original position
            const firstShape = shapes[0];
            const originalPos = this.dragStartPositions[0];
            const totalDx = firstShape.x - originalPos.x;
            const totalDy = firstShape.y - originalPos.y;
            
            // Only create command if there was actual movement
            if (totalDx !== 0 || totalDy !== 0) {
                const command = new MoveShapesCommand(shapes, totalDx, totalDy);
                // Don't execute since we already moved visually - just add to history
                this.commandManager.addToHistory(command);
                
                // Emit shape updated event for connections
                shapes.forEach(shape => {
                    this.eventBus.emit(Events.SHAPE_UPDATED, { shape, property: 'position' });
                });
            }
        }
        
        this.isDragging = false;
        this.state = 'idle';
        this.dragStartPoint = null;
        this.dragStartPositions = null;

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
        this.connectionSourceY = null;
        this.state = 'idle';

        // Remove preview line and tooltip
        this.removeConnectionPreview();

        const preview = document.getElementById('connection-preview');
        if (preview) preview.style.display = 'none';
    }
}
