/**
 * Activity Diagram Plugin
 * Complete UML Activity Diagram elements
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Activity Initial Node
 */
export class ActivityInitial extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'actInitial', width: 30, height: 30 });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-actInitial');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 15);
        circle.setAttribute('cy', 15);
        circle.setAttribute('r', 12);
        circle.setAttribute('fill', '#333');
        this.element.appendChild(circle);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Activity Final Node
 */
export class ActivityFinal extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'actFinal', width: 30, height: 30 });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-actFinal');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outer.setAttribute('cx', 15);
        outer.setAttribute('cy', 15);
        outer.setAttribute('r', 13);
        outer.setAttribute('fill', 'white');
        outer.setAttribute('stroke', '#333');
        outer.setAttribute('stroke-width', '2');
        this.element.appendChild(outer);

        const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        inner.setAttribute('cx', 15);
        inner.setAttribute('cy', 15);
        inner.setAttribute('r', 8);
        inner.setAttribute('fill', '#333');
        this.element.appendChild(inner);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Action Node (rounded rectangle)
 */
export class ActionNode extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'action', width: 140, height: 50 });
        this.properties.name = options.name || 'Action';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-action');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', '12');
        rect.setAttribute('fill', this.style.fill);
        rect.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Decision/Merge Node (diamond)
 */
export class DecisionNode extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'decision', width: 40, height: 40 });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-decision');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const cx = 20, cy = 20;
        diamond.setAttribute('points', `${cx},2 38,${cy} ${cx},38 2,${cy}`);
        diamond.setAttribute('fill', this.style.fill);
        diamond.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(diamond);

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Fork/Join Node (horizontal bar)
 */
export class ActivityForkJoin extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'actForkJoin', width: 100, height: 8 });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-actForkJoin');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', '#333');
        this.element.appendChild(rect);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Swimlane/Partition
 */
export class Swimlane extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'swimlane', width: 180, height: 400 });
        this.properties.name = options.name || 'Swimlane';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-swimlane');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', this.style.stroke);
        rect.setAttribute('stroke-width', '2');
        this.element.appendChild(rect);

        // Header
        const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        header.setAttribute('width', this.width);
        header.setAttribute('height', 30);
        header.setAttribute('fill', '#f5f5f5');
        header.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(header);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', 20);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-weight', 'bold');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Object Node
 */
export class ObjectNode extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'objectNode', width: 100, height: 50 });
        this.properties.name = options.name || 'Object';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-objectNode');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('fill', this.style.fill);
        rect.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Send Signal
 */
export class SendSignal extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'sendSignal', width: 100, height: 40 });
        this.properties.name = options.name || 'Signal';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-sendSignal');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Pentagon pointing right
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', `0,0 80,0 100,20 80,40 0,40`);
        polygon.setAttribute('fill', this.style.fill);
        polygon.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(polygon);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 45);
        text.setAttribute('y', 25);
        text.setAttribute('text-anchor', 'middle');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Accept Event
 */
export class AcceptEvent extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'acceptEvent', width: 100, height: 40 });
        this.properties.name = options.name || 'Event';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-acceptEvent');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Pentagon with concave left
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', `20,0 100,0 100,40 20,40 0,20`);
        polygon.setAttribute('fill', this.style.fill);
        polygon.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(polygon);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 55);
        text.setAttribute('y', 25);
        text.setAttribute('text-anchor', 'middle');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Activity Diagram Plugin
 */
export class ActivityPlugin extends DiagramPlugin {
    get id() { return 'activity'; }
    get name() { return 'Activity Diagram'; }
    get icon() { return 'activity-icon'; }
    get color() { return '#EF4444'; }

    getShapeTools() {
        return [
            new ToolDefinition({ id: 'actInitial', name: 'Initial', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'actFinal', name: 'Final', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'action', name: 'Action', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="6"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'decision', name: 'Decision/Merge', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,12 12,22 2,12"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'actForkJoin', name: 'Fork/Join', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="10" width="18" height="4" rx="1"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'swimlane', name: 'Swimlane', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="2" width="18" height="20"/><line x1="3" y1="7" x2="21" y2="7"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'objectNode', name: 'Object', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="6" width="16" height="12"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'sendSignal', name: 'Send Signal', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3,6 17,6 21,12 17,18 3,18"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'acceptEvent', name: 'Accept Event', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7,6 21,6 21,18 7,18 3,12"/></svg>`, type: 'shape' })
        ];
    }

    getConnectorTools() {
        return [
            new ToolDefinition({ id: 'controlFlow', name: 'Control Flow', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="18" y2="12"/><polygon points="21,12 15,8 15,16" fill="currentColor"/></svg>`, type: 'connector' }),
            new ToolDefinition({ id: 'objectFlow', name: 'Object Flow', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="4 2"/><polygon points="21,12 15,8 15,16" fill="currentColor"/></svg>`, type: 'connector' })
        ];
    }

    getShapeDefinitions() {
        return {
            'actInitial': new ShapeDefinition({ type: 'actInitial', name: 'Initial', defaultWidth: 30, defaultHeight: 30 }),
            'actFinal': new ShapeDefinition({ type: 'actFinal', name: 'Final', defaultWidth: 30, defaultHeight: 30 }),
            'action': new ShapeDefinition({ type: 'action', name: 'Action', defaultWidth: 140, defaultHeight: 50 }),
            'decision': new ShapeDefinition({ type: 'decision', name: 'Decision', defaultWidth: 40, defaultHeight: 40 }),
            'actForkJoin': new ShapeDefinition({ type: 'actForkJoin', name: 'Fork/Join', defaultWidth: 100, defaultHeight: 8 }),
            'swimlane': new ShapeDefinition({ type: 'swimlane', name: 'Swimlane', defaultWidth: 180, defaultHeight: 400 }),
            'objectNode': new ShapeDefinition({ type: 'objectNode', name: 'Object', defaultWidth: 100, defaultHeight: 50 }),
            'sendSignal': new ShapeDefinition({ type: 'sendSignal', name: 'Send Signal', defaultWidth: 100, defaultHeight: 40 }),
            'acceptEvent': new ShapeDefinition({ type: 'acceptEvent', name: 'Accept Event', defaultWidth: 100, defaultHeight: 40 })
        };
    }

    getConnectorTypes() {
        return [
            new ConnectorDefinition({ type: 'controlFlow', name: 'Control Flow', lineStyle: 'solid', targetArrow: 'filled' }),
            new ConnectorDefinition({ type: 'objectFlow', name: 'Object Flow', lineStyle: 'dashed', targetArrow: 'filled' })
        ];
    }

    onActivate() { console.log('Activity Diagram plugin activated'); }
    onDeactivate() { console.log('Activity Diagram plugin deactivated'); }
}

// Register shapes
ShapeFactory.register('actInitial', ActivityInitial, { width: 30, height: 30 });
ShapeFactory.register('actFinal', ActivityFinal, { width: 30, height: 30 });
ShapeFactory.register('action', ActionNode, { width: 140, height: 50 });
ShapeFactory.register('decision', DecisionNode, { width: 40, height: 40 });
ShapeFactory.register('actForkJoin', ActivityForkJoin, { width: 100, height: 8 });
ShapeFactory.register('swimlane', Swimlane, { width: 180, height: 400 });
ShapeFactory.register('objectNode', ObjectNode, { width: 100, height: 50 });
ShapeFactory.register('sendSignal', SendSignal, { width: 100, height: 40 });
ShapeFactory.register('acceptEvent', AcceptEvent, { width: 100, height: 40 });
