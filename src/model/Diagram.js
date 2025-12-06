/**
 * Diagram Model - Central data structure for a diagram
 */

import { EventBus, Events } from '../core/EventBus.js';
import { generateId } from '../utils/geometry.js';

export class Diagram {
    constructor(options = {}) {
        this.id = options.id || generateId('diagram');
        this.type = options.type || 'sequence';
        this.name = options.name || 'Untitled Diagram';
        this.created = options.created || new Date().toISOString();
        this.modified = options.modified || new Date().toISOString();

        // Collections
        this.shapes = new Map();
        this.connections = new Map();

        // Viewport state
        this.viewport = {
            x: options.viewport?.x || 0,
            y: options.viewport?.y || 0,
            zoom: options.viewport?.zoom || 1
        };

        // Metadata
        this.metadata = {
            author: '',
            version: '1.0',
            ...options.metadata
        };

        this.eventBus = EventBus.getInstance();
    }

    /**
     * Add a shape to the diagram
     * @param {Shape} shape - Shape to add
     */
    addShape(shape) {
        shape.diagramType = this.type;
        this.shapes.set(shape.id, shape);
        this.modified = new Date().toISOString();
        this.eventBus.emit(Events.SHAPE_ADDED, { shape, diagram: this });
    }

    /**
     * Remove a shape from the diagram
     * @param {string} shapeId - Shape ID
     * @returns {Shape|null} Removed shape
     */
    removeShape(shapeId) {
        const shape = this.shapes.get(shapeId);
        if (shape) {
            shape.remove();
            this.shapes.delete(shapeId);
            this.modified = new Date().toISOString();
            this.eventBus.emit(Events.SHAPE_REMOVED, { shape, diagram: this });
        }
        return shape;
    }

    /**
     * Get a shape by ID
     * @param {string} shapeId - Shape ID
     * @returns {Shape|undefined}
     */
    getShape(shapeId) {
        return this.shapes.get(shapeId);
    }

    /**
     * Get all shapes
     * @returns {Shape[]}
     */
    getShapes() {
        return Array.from(this.shapes.values());
    }

    /**
     * Add a connection to the diagram
     * @param {Connection} connection - Connection to add
     */
    addConnection(connection) {
        connection.diagramType = this.type;

        // Link to shapes
        if (connection.source.shapeId) {
            connection.sourceShape = this.shapes.get(connection.source.shapeId);
        }
        if (connection.target.shapeId) {
            connection.targetShape = this.shapes.get(connection.target.shapeId);
        }

        this.connections.set(connection.id, connection);
        this.modified = new Date().toISOString();
        this.eventBus.emit(Events.CONNECTION_ADDED, { connection, diagram: this });
    }

    /**
     * Remove a connection from the diagram
     * @param {string} connectionId - Connection ID
     * @returns {Connection|null} Removed connection
     */
    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.remove();
            this.connections.delete(connectionId);
            this.modified = new Date().toISOString();
            this.eventBus.emit(Events.CONNECTION_REMOVED, { connection, diagram: this });
        }
        return connection;
    }

    /**
     * Get a connection by ID
     * @param {string} connectionId - Connection ID
     * @returns {Connection|undefined}
     */
    getConnection(connectionId) {
        return this.connections.get(connectionId);
    }

    /**
     * Get all connections
     * @returns {Connection[]}
     */
    getConnections() {
        return Array.from(this.connections.values());
    }

    /**
     * Get connections for a shape
     * @param {string} shapeId - Shape ID
     * @returns {Connection[]}
     */
    getConnectionsForShape(shapeId) {
        return this.getConnections().filter(conn =>
            conn.source.shapeId === shapeId || conn.target.shapeId === shapeId
        );
    }

    /**
     * Find shape at point
     * @param {Point} point - Point to check
     * @returns {Shape|null}
     */
    findShapeAtPoint(point) {
        // Search in reverse order (top-most first)
        const shapes = this.getShapes().reverse();
        for (const shape of shapes) {
            if (shape.containsPoint(point)) {
                return shape;
            }
        }
        return null;
    }

    /**
     * Find connection at point
     * @param {Point} point - Point to check
     * @param {number} threshold - Distance threshold
     * @returns {Connection|null}
     */
    findConnectionAtPoint(point, threshold = 10) {
        for (const conn of this.getConnections()) {
            if (conn.isPointNear(point, threshold)) {
                return conn;
            }
        }
        return null;
    }

    /**
     * Find element (shape or connection) at point
     * @param {Point} point - Point to check
     * @returns {Shape|Connection|null}
     */
    findElementAtPoint(point) {
        // Shapes have priority
        const shape = this.findShapeAtPoint(point);
        if (shape) return shape;

        return this.findConnectionAtPoint(point);
    }

    /**
     * Clear the diagram
     */
    clear() {
        this.connections.forEach(conn => conn.remove());
        this.shapes.forEach(shape => shape.remove());
        this.connections.clear();
        this.shapes.clear();
        this.modified = new Date().toISOString();
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            created: this.created,
            modified: this.modified,
            viewport: { ...this.viewport },
            metadata: { ...this.metadata },
            shapes: this.getShapes().map(s => s.toJSON()),
            connections: this.getConnections().map(c => c.toJSON())
        };
    }

    /**
     * Create diagram from JSON
     * @param {Object} data - JSON data
     * @param {Function} shapeFactory - Shape creation function
     * @param {Function} connectionFactory - Connection creation function
     * @returns {Diagram}
     */
    static fromJSON(data, shapeFactory, connectionFactory) {
        const diagram = new Diagram({
            id: data.id,
            type: data.type,
            name: data.name,
            created: data.created,
            modified: data.modified,
            viewport: data.viewport,
            metadata: data.metadata
        });

        // Restore shapes
        if (data.shapes && shapeFactory) {
            data.shapes.forEach(shapeData => {
                const shape = shapeFactory(shapeData);
                diagram.shapes.set(shape.id, shape);
            });
        }

        // Restore connections
        if (data.connections && connectionFactory) {
            data.connections.forEach(connData => {
                const conn = connectionFactory(connData);
                // Link to shapes
                if (conn.source.shapeId) {
                    conn.sourceShape = diagram.shapes.get(conn.source.shapeId);
                }
                if (conn.target.shapeId) {
                    conn.targetShape = diagram.shapes.get(conn.target.shapeId);
                }
                diagram.connections.set(conn.id, conn);
            });
        }

        return diagram;
    }
}
