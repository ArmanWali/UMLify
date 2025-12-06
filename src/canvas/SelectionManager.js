/**
 * SelectionManager - Manages selection state and operations
 */

import { EventBus, Events } from '../core/EventBus.js';
import { Rectangle } from '../utils/geometry.js';

export class SelectionManager {
    constructor() {
        this.selectedShapes = new Set();
        this.selectedConnections = new Set();
        this.eventBus = EventBus.getInstance();
    }

    /**
     * Select a shape
     * @param {Shape} shape - Shape to select
     * @param {boolean} addToSelection - Add to existing selection
     */
    selectShape(shape, addToSelection = false) {
        if (!addToSelection) {
            this.clearSelection();
        }

        shape.setSelected(true);
        this.selectedShapes.add(shape);

        this.eventBus.emit(Events.SHAPE_SELECTED, { shape });
        this.emitSelectionChanged();
    }

    /**
     * Select a connection
     * @param {Connection} connection - Connection to select
     * @param {boolean} addToSelection - Add to existing selection
     */
    selectConnection(connection, addToSelection = false) {
        if (!addToSelection) {
            this.clearSelection();
        }

        connection.setSelected(true);
        this.selectedConnections.add(connection);

        this.eventBus.emit(Events.CONNECTION_SELECTED, { connection });
        this.emitSelectionChanged();
    }

    /**
     * Select multiple shapes
     * @param {Shape[]} shapes - Shapes to select
     */
    selectShapes(shapes) {
        this.clearSelection();
        shapes.forEach(shape => {
            shape.setSelected(true);
            this.selectedShapes.add(shape);
        });
        this.emitSelectionChanged();
    }

    /**
     * Deselect a shape
     * @param {Shape} shape - Shape to deselect
     */
    deselectShape(shape) {
        shape.setSelected(false);
        this.selectedShapes.delete(shape);

        this.eventBus.emit(Events.SHAPE_DESELECTED, { shape });
        this.emitSelectionChanged();
    }

    /**
     * Toggle shape selection
     * @param {Shape} shape - Shape to toggle
     */
    toggleShape(shape) {
        if (this.selectedShapes.has(shape)) {
            this.deselectShape(shape);
        } else {
            this.selectShape(shape, true);
        }
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedShapes.forEach(shape => shape.setSelected(false));
        this.selectedConnections.forEach(conn => conn.setSelected(false));

        this.selectedShapes.clear();
        this.selectedConnections.clear();

        this.eventBus.emit(Events.SELECTION_CLEARED, {});
        this.emitSelectionChanged();
    }

    /**
     * Check if anything is selected
     * @returns {boolean}
     */
    hasSelection() {
        return this.selectedShapes.size > 0 || this.selectedConnections.size > 0;
    }

    /**
     * Get selected shapes
     * @returns {Shape[]}
     */
    getSelectedShapes() {
        return Array.from(this.selectedShapes);
    }

    /**
     * Get selected connections
     * @returns {Connection[]}
     */
    getSelectedConnections() {
        return Array.from(this.selectedConnections);
    }

    /**
     * Get all selected elements
     * @returns {Array}
     */
    getAllSelected() {
        return [...this.getSelectedShapes(), ...this.getSelectedConnections()];
    }

    /**
     * Get bounding box of selection
     * @returns {Rectangle|null}
     */
    getSelectionBounds() {
        const shapes = this.getSelectedShapes();
        if (shapes.length === 0) return null;

        let bounds = shapes[0].getBounds();
        for (let i = 1; i < shapes.length; i++) {
            bounds = bounds.union(shapes[i].getBounds());
        }
        return bounds;
    }

    /**
     * Get the first (or only) selected element
     * @returns {Shape|Connection|null}
     */
    getPrimarySelection() {
        if (this.selectedShapes.size > 0) {
            return this.selectedShapes.values().next().value;
        }
        if (this.selectedConnections.size > 0) {
            return this.selectedConnections.values().next().value;
        }
        return null;
    }

    /**
     * Check if a shape is selected
     * @param {Shape} shape - Shape to check
     * @returns {boolean}
     */
    isSelected(shape) {
        return this.selectedShapes.has(shape);
    }

    emitSelectionChanged() {
        const shapes = this.getSelectedShapes();
        const connections = this.getSelectedConnections();
        const count = shapes.length + connections.length;

        // Update status bar
        const statusSelection = document.getElementById('status-selection');
        if (statusSelection) {
            if (count === 0) {
                statusSelection.textContent = 'No selection';
            } else if (count === 1) {
                const elem = shapes[0] || connections[0];
                statusSelection.textContent = `Selected: ${elem.type}`;
            } else {
                statusSelection.textContent = `Selected: ${count} elements`;
            }
        }

        this.eventBus.emit(Events.SELECTION_CHANGED, {
            shapes,
            connections,
            count,
            primary: this.getPrimarySelection()
        });
    }
}
