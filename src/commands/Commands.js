/**
 * Specific Command implementations for diagram operations
 */

import { Command } from '../core/CommandManager.js';
import { EventBus, Events } from '../core/EventBus.js';

/**
 * Command to add a shape to the diagram
 */
export class AddShapeCommand extends Command {
    constructor(diagram, shape) {
        super(`Add ${shape.type}`);
        this.diagram = diagram;
        this.shape = shape;
    }

    execute() {
        this.diagram.addShape(this.shape);
    }

    undo() {
        this.diagram.removeShape(this.shape.id);
    }
}

/**
 * Command to remove a shape from the diagram
 */
export class RemoveShapeCommand extends Command {
    constructor(diagram, shape) {
        super(`Delete ${shape.type}`);
        this.diagram = diagram;
        this.shape = shape;
        this.relatedConnections = [];
    }

    execute() {
        // Store connections that will be removed
        this.relatedConnections = this.diagram.getConnectionsForShape(this.shape.id);

        // Remove connections first
        this.relatedConnections.forEach(conn => {
            this.diagram.removeConnection(conn.id);
        });

        // Remove shape
        this.diagram.removeShape(this.shape.id);
    }

    undo() {
        // Restore shape
        this.diagram.addShape(this.shape);

        // Restore connections
        this.relatedConnections.forEach(conn => {
            this.diagram.addConnection(conn);
        });
    }
}

/**
 * Command to move one or more shapes
 */
export class MoveShapesCommand extends Command {
    constructor(shapes, dx, dy) {
        super(shapes.length > 1 ? `Move ${shapes.length} shapes` : `Move ${shapes[0].type}`);
        this.shapes = shapes;
        this.dx = dx;
        this.dy = dy;
    }

    execute() {
        this.shapes.forEach(shape => {
            shape.move(this.dx, this.dy);
        });
    }

    undo() {
        this.shapes.forEach(shape => {
            shape.move(-this.dx, -this.dy);
        });
    }
}

/**
 * Command to resize a shape
 */
export class ResizeShapeCommand extends Command {
    constructor(shape, oldBounds, newBounds) {
        super(`Resize ${shape.type}`);
        this.shape = shape;
        this.oldBounds = oldBounds;
        this.newBounds = newBounds;
    }

    execute() {
        this.shape.setPosition(this.newBounds.x, this.newBounds.y);
        this.shape.setSize(this.newBounds.width, this.newBounds.height);
    }

    undo() {
        this.shape.setPosition(this.oldBounds.x, this.oldBounds.y);
        this.shape.setSize(this.oldBounds.width, this.oldBounds.height);
    }
}

/**
 * Command to add a connection
 */
export class AddConnectionCommand extends Command {
    constructor(diagram, connection) {
        super(`Connect with ${connection.type}`);
        this.diagram = diagram;
        this.connection = connection;
    }

    execute() {
        this.diagram.addConnection(this.connection);
    }

    undo() {
        this.diagram.removeConnection(this.connection.id);
    }
}

/**
 * Command to remove a connection
 */
export class RemoveConnectionCommand extends Command {
    constructor(diagram, connection) {
        super(`Delete connection`);
        this.diagram = diagram;
        this.connection = connection;
    }

    execute() {
        this.diagram.removeConnection(this.connection.id);
    }

    undo() {
        this.diagram.addConnection(this.connection);
    }
}

/**
 * Command to update a property
 */
export class UpdatePropertyCommand extends Command {
    constructor(element, property, oldValue, newValue) {
        super(`Update ${property}`);
        this.element = element;
        this.property = property;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    execute() {
        this.element.setProperty(this.property, this.newValue);
    }

    undo() {
        this.element.setProperty(this.property, this.oldValue);
    }
}

/**
 * Command to update style
 */
export class UpdateStyleCommand extends Command {
    constructor(element, oldStyle, newStyle) {
        super(`Update style`);
        this.element = element;
        this.oldStyle = { ...oldStyle };
        this.newStyle = { ...newStyle };
    }

    execute() {
        this.element.setStyle(this.newStyle);
    }

    undo() {
        this.element.setStyle(this.oldStyle);
    }
}
