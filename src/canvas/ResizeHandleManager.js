/**
 * ResizeHandleManager - Renders and manages resize handles for selected shapes
 */

import { EventBus, Events } from '../core/EventBus.js';
import { Point } from '../utils/geometry.js';

export class ResizeHandleManager {
    constructor(canvas, selectionManager) {
        this.canvas = canvas;
        this.selectionManager = selectionManager;
        this.eventBus = EventBus.getInstance();

        this.handleSize = 8;
        this.handles = [];
        this.activeHandle = null;
        this.handleGroup = null;

        this.init();
    }

    init() {
        // Listen for selection changes
        this.eventBus.on(Events.SELECTION_CHANGED, this.onSelectionChanged.bind(this));

        // Listen for shape updates to reposition handles
        this.eventBus.on(Events.SHAPE_UPDATED, this.updateHandles.bind(this));
    }

    /**
     * Handle positions relative to shape bounds
     */
    getHandlePositions(bounds) {
        const { x, y, width, height } = bounds;
        return [
            { id: 'nw', x: x, y: y, cursor: 'nwse-resize' },
            { id: 'n', x: x + width / 2, y: y, cursor: 'ns-resize' },
            { id: 'ne', x: x + width, y: y, cursor: 'nesw-resize' },
            { id: 'e', x: x + width, y: y + height / 2, cursor: 'ew-resize' },
            { id: 'se', x: x + width, y: y + height, cursor: 'nwse-resize' },
            { id: 's', x: x + width / 2, y: y + height, cursor: 'ns-resize' },
            { id: 'sw', x: x, y: y + height, cursor: 'nesw-resize' },
            { id: 'w', x: x, y: y + height / 2, cursor: 'ew-resize' }
        ];
    }

    onSelectionChanged({ shapes }) {
        this.clearHandles();

        if (shapes.length === 1) {
            this.renderHandles(shapes[0]);
        }
    }

    /**
     * Render resize handles for a shape
     */
    renderHandles(shape) {
        const interactionLayer = this.canvas.getInteractionLayer();

        // Create handle group
        this.handleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.handleGroup.setAttribute('class', 'resize-handles');
        this.handleGroup.setAttribute('data-shape-id', shape.id);

        const bounds = shape.getBounds();
        const positions = this.getHandlePositions(bounds);

        positions.forEach(pos => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            handle.setAttribute('class', `resize-handle resize-handle--${pos.id}`);
            handle.setAttribute('x', pos.x - this.handleSize / 2);
            handle.setAttribute('y', pos.y - this.handleSize / 2);
            handle.setAttribute('width', this.handleSize);
            handle.setAttribute('height', this.handleSize);
            handle.setAttribute('fill', '#ffffff');
            handle.setAttribute('stroke', '#0066FF');
            handle.setAttribute('stroke-width', '1.5');
            handle.setAttribute('data-handle', pos.id);
            handle.style.cursor = pos.cursor;

            this.handleGroup.appendChild(handle);
            this.handles.push({ element: handle, id: pos.id, cursor: pos.cursor });
        });

        interactionLayer.appendChild(this.handleGroup);
    }

    /**
     * Update handle positions
     */
    updateHandles() {
        const shapes = this.selectionManager.getSelectedShapes();
        if (shapes.length !== 1 || !this.handleGroup) return;

        const shape = shapes[0];
        const bounds = shape.getBounds();
        const positions = this.getHandlePositions(bounds);

        positions.forEach(pos => {
            const handle = this.handleGroup.querySelector(`[data-handle="${pos.id}"]`);
            if (handle) {
                handle.setAttribute('x', pos.x - this.handleSize / 2);
                handle.setAttribute('y', pos.y - this.handleSize / 2);
            }
        });
    }

    /**
     * Clear all handles
     */
    clearHandles() {
        if (this.handleGroup && this.handleGroup.parentNode) {
            this.handleGroup.parentNode.removeChild(this.handleGroup);
        }
        this.handleGroup = null;
        this.handles = [];
    }

    /**
     * Check if a point is on a resize handle
     * @returns {Object|null} Handle info or null
     */
    getHandleAtPoint(point) {
        if (!this.handleGroup) return null;

        for (const handle of this.handles) {
            const rect = handle.element.getBBox();
            if (point.x >= rect.x && point.x <= rect.x + rect.width &&
                point.y >= rect.y && point.y <= rect.y + rect.height) {
                return handle;
            }
        }
        return null;
    }

    /**
     * Calculate new bounds based on handle drag
     */
    calculateNewBounds(originalBounds, handleId, dx, dy) {
        let { x, y, width, height } = originalBounds;

        switch (handleId) {
            case 'nw':
                x += dx;
                y += dy;
                width -= dx;
                height -= dy;
                break;
            case 'n':
                y += dy;
                height -= dy;
                break;
            case 'ne':
                y += dy;
                width += dx;
                height -= dy;
                break;
            case 'e':
                width += dx;
                break;
            case 'se':
                width += dx;
                height += dy;
                break;
            case 's':
                height += dy;
                break;
            case 'sw':
                x += dx;
                width -= dx;
                height += dy;
                break;
            case 'w':
                x += dx;
                width -= dx;
                break;
        }

        // Enforce minimum size
        const minWidth = 40;
        const minHeight = 30;

        if (width < minWidth) {
            if (handleId.includes('w')) x -= (minWidth - width);
            width = minWidth;
        }
        if (height < minHeight) {
            if (handleId.includes('n')) y -= (minHeight - height);
            height = minHeight;
        }

        return { x, y, width, height };
    }
}
