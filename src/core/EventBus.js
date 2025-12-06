/**
 * EventBus - Observer Pattern Implementation
 * Central event system for loose coupling between components
 */
export class EventBus {
    static #instance = null;
    
    constructor() {
        if (EventBus.#instance) {
            return EventBus.#instance;
        }
        this.listeners = new Map();
        EventBus.#instance = this;
    }
    
    static getInstance() {
        if (!EventBus.#instance) {
            EventBus.#instance = new EventBus();
        }
        return EventBus.#instance;
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    /**
     * Subscribe to an event (fires only once)
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        this.on(event, wrapper);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for "${event}":`, error);
                }
            });
        }
    }
    
    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Event name constants
export const Events = {
    // Diagram events
    DIAGRAM_TYPE_CHANGED: 'diagram:typeChanged',
    DIAGRAM_LOADED: 'diagram:loaded',
    DIAGRAM_SAVED: 'diagram:saved',
    DIAGRAM_MODIFIED: 'diagram:modified',
    
    // Tool events
    TOOL_SELECTED: 'tool:selected',
    TOOL_DESELECTED: 'tool:deselected',
    
    // Shape events
    SHAPE_ADDED: 'shape:added',
    SHAPE_REMOVED: 'shape:removed',
    SHAPE_MOVED: 'shape:moved',
    SHAPE_RESIZED: 'shape:resized',
    SHAPE_SELECTED: 'shape:selected',
    SHAPE_DESELECTED: 'shape:deselected',
    SHAPE_UPDATED: 'shape:updated',
    
    // Connection events
    CONNECTION_ADDED: 'connection:added',
    CONNECTION_REMOVED: 'connection:removed',
    CONNECTION_UPDATED: 'connection:updated',
    CONNECTION_SELECTED: 'connection:selected',
    
    // Selection events
    SELECTION_CHANGED: 'selection:changed',
    SELECTION_CLEARED: 'selection:cleared',
    
    // Canvas events
    CANVAS_CLICKED: 'canvas:clicked',
    CANVAS_PANNED: 'canvas:panned',
    CANVAS_ZOOMED: 'canvas:zoomed',
    CANVAS_MOUSE_MOVE: 'canvas:mouseMove',
    
    // Command events (for undo/redo)
    COMMAND_EXECUTED: 'command:executed',
    COMMAND_UNDONE: 'command:undone',
    COMMAND_REDONE: 'command:redone',
    HISTORY_CHANGED: 'history:changed',
    
    // UI events
    PROPERTIES_UPDATED: 'properties:updated',
    STATUS_UPDATED: 'status:updated'
};
