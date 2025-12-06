/**
 * Toolbar UI Component
 */

import { EventBus, Events } from '../core/EventBus.js';
import { PluginRegistry } from '../core/PluginRegistry.js';

export class Toolbar {
    constructor() {
        this.container = document.getElementById('toolbar');
        this.shapeToolsContainer = document.getElementById('shape-tools');
        this.connectorToolsContainer = document.getElementById('connector-tools');

        this.currentTool = 'select';
        this.eventBus = EventBus.getInstance();
        this.pluginRegistry = PluginRegistry.getInstance();

        // Drag state
        this.draggedTool = null;
        this.dragPreview = null;

        this.init();
    }

    init() {
        // Listen for diagram type changes
        this.eventBus.on(Events.DIAGRAM_TYPE_CHANGED, this.handleDiagramTypeChanged.bind(this));

        // Setup common tool clicks and drag
        this.container.querySelectorAll('.tool[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
            this.setupDragEvents(btn);
        });

        // Initial state - select tool is active
        this.selectTool('select');

        // Setup canvas drop zone
        this.setupCanvasDropZone();
    }

    handleDiagramTypeChanged({ plugin }) {
        this.renderDiagramTools(plugin);
    }

    renderDiagramTools(plugin) {
        // Clear existing
        this.shapeToolsContainer.innerHTML = '';
        this.connectorToolsContainer.innerHTML = '';

        // Render shape tools
        const shapeTools = plugin.getShapeTools();
        shapeTools.forEach(tool => {
            const btn = this.createToolButton(tool);
            this.shapeToolsContainer.appendChild(btn);
        });

        // Render connector tools
        const connectorTools = plugin.getConnectorTools();
        connectorTools.forEach(tool => {
            const btn = this.createToolButton(tool);
            this.connectorToolsContainer.appendChild(btn);
        });
    }

    createToolButton(tool) {
        const btn = document.createElement('button');
        btn.className = 'tool';
        btn.classList.add(`tool--${tool.type}`);
        btn.dataset.tool = tool.id;
        btn.dataset.toolType = tool.type;
        btn.draggable = true;

        // Icon
        const iconSpan = document.createElement('span');
        iconSpan.className = 'tool__icon';
        iconSpan.innerHTML = tool.icon;
        btn.appendChild(iconSpan);

        // Label
        const labelSpan = document.createElement('span');
        labelSpan.className = 'tool__label';
        labelSpan.textContent = tool.name;
        btn.appendChild(labelSpan);

        // Shortcut hint
        if (tool.shortcut) {
            btn.title = `${tool.name} (${tool.shortcut})`;
        } else {
            btn.title = tool.name;
        }

        // Click to select tool
        btn.addEventListener('click', () => this.selectTool(tool.id));

        // Drag events
        this.setupDragEvents(btn);

        return btn;
    }

    setupDragEvents(btn) {
        btn.addEventListener('dragstart', (e) => {
            this.draggedTool = btn.dataset.tool;
            btn.classList.add('dragging');

            // Set drag data
            e.dataTransfer.setData('text/plain', btn.dataset.tool);
            e.dataTransfer.setData('application/x-umlify-tool', JSON.stringify({
                toolId: btn.dataset.tool,
                toolType: btn.dataset.toolType || 'shape'
            }));
            e.dataTransfer.effectAllowed = 'copy';

            // Create custom drag image
            this.createDragPreview(btn);
            if (this.dragPreview) {
                e.dataTransfer.setDragImage(this.dragPreview, 30, 30);
            }
        });

        btn.addEventListener('dragend', (e) => {
            btn.classList.remove('dragging');
            this.draggedTool = null;
            this.removeDragPreview();
        });
    }

    createDragPreview(btn) {
        this.dragPreview = document.createElement('div');
        this.dragPreview.className = 'drag-preview';
        this.dragPreview.innerHTML = btn.querySelector('.tool__icon')?.innerHTML || btn.innerHTML;
        this.dragPreview.style.cssText = `
            position: absolute;
            top: -1000px;
            left: -1000px;
            width: 60px;
            height: 60px;
            background: white;
            border: 2px solid var(--color-accent, #0066FF);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            pointer-events: none;
        `;
        document.body.appendChild(this.dragPreview);
    }

    removeDragPreview() {
        if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
        }
    }

    setupCanvasDropZone() {
        const canvas = document.getElementById('canvas');
        const canvasContainer = document.getElementById('canvas-container');

        if (!canvasContainer) return;

        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            canvasContainer.classList.add('drag-over');
        });

        canvasContainer.addEventListener('dragleave', (e) => {
            canvasContainer.classList.remove('drag-over');
        });

        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            canvasContainer.classList.remove('drag-over');

            // Get tool data
            const toolDataStr = e.dataTransfer.getData('application/x-umlify-tool');
            if (!toolDataStr) return;

            try {
                const toolData = JSON.parse(toolDataStr);

                // Get drop position relative to canvas
                const rect = canvas.getBoundingClientRect();
                const svgCanvas = canvas;
                const viewBox = svgCanvas.viewBox.baseVal;

                // Convert screen coords to SVG coords
                const scaleX = viewBox.width / rect.width;
                const scaleY = viewBox.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX + viewBox.x;
                const y = (e.clientY - rect.top) * scaleY + viewBox.y;

                // Emit event to create shape at position
                this.eventBus.emit('tool:dropped', {
                    toolId: toolData.toolId,
                    toolType: toolData.toolType,
                    x: x,
                    y: y
                });

            } catch (err) {
                console.error('Error parsing dropped tool data:', err);
            }
        });
    }

    selectTool(toolId) {
        // Deselect previous
        this.container.querySelectorAll('.tool').forEach(btn => {
            btn.classList.remove('tool--active');
        });

        // Select new
        const btn = this.container.querySelector(`[data-tool="${toolId}"]`);
        if (btn) {
            btn.classList.add('tool--active');
        }

        this.currentTool = toolId;

        // Update status bar
        const statusTool = document.getElementById('status-tool');
        if (statusTool) {
            const toolName = btn?.title?.split(' (')[0] || toolId;
            statusTool.textContent = `Tool: ${toolName}`;
        }

        // Emit event
        this.eventBus.emit(Events.TOOL_SELECTED, { toolId });
    }

    getCurrentTool() {
        return this.currentTool;
    }
}
