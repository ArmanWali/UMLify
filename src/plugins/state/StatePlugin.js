/**
 * State Diagram Plugin
 * Complete UML State Machine Diagram elements
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Initial State (filled circle)
 */
export class InitialState extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'initial',
            width: options.width || 30,
            height: options.height || 30
        });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-initial');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', this.width / 2);
        circle.setAttribute('cy', this.height / 2);
        circle.setAttribute('r', this.width / 2 - 2);
        circle.setAttribute('fill', '#333333');
        circle.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(circle);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const circle = this.element.querySelector('circle');
        if (circle) {
            circle.setAttribute('cx', this.width / 2);
            circle.setAttribute('cy', this.height / 2);
            circle.setAttribute('r', Math.min(this.width, this.height) / 2 - 2);
        }
    }
}

/**
 * Final State (bullseye)
 */
export class FinalState extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'final',
            width: options.width || 30,
            height: options.height || 30
        });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-final');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Outer circle
        const outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outer.setAttribute('cx', this.width / 2);
        outer.setAttribute('cy', this.height / 2);
        outer.setAttribute('r', this.width / 2 - 2);
        outer.setAttribute('fill', 'white');
        outer.setAttribute('stroke', this.style.stroke);
        outer.setAttribute('stroke-width', '2');
        this.element.appendChild(outer);

        // Inner circle
        const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        inner.setAttribute('cx', this.width / 2);
        inner.setAttribute('cy', this.height / 2);
        inner.setAttribute('r', this.width / 2 - 6);
        inner.setAttribute('fill', '#333333');
        this.element.appendChild(inner);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const r = Math.min(this.width, this.height) / 2;

        const outer = this.element.querySelector('circle:first-child');
        if (outer) {
            outer.setAttribute('cx', this.width / 2);
            outer.setAttribute('cy', this.height / 2);
            outer.setAttribute('r', r - 2);
        }

        const inner = this.element.querySelector('circle:last-child');
        if (inner) {
            inner.setAttribute('cx', this.width / 2);
            inner.setAttribute('cy', this.height / 2);
            inner.setAttribute('r', r - 6);
        }
    }
}

/**
 * State Shape (rounded rectangle with optional compartments)
 */
export class StateShape extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'state',
            width: options.width || 120,
            height: options.height || 60
        });
        this.properties.name = options.name || 'State';
        this.properties.entryAction = options.entryAction || '';
        this.properties.exitAction = options.exitAction || '';
        this.properties.doActivity = options.doActivity || '';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-state');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Rounded rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'shape__body');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', '12');
        rect.setAttribute('fill', this.style.fill);
        rect.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(rect);

        // State name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'shape__text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-weight', 'bold');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        // Add internal actions if present
        if (this.properties.entryAction || this.properties.exitAction || this.properties.doActivity) {
            const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            divider.setAttribute('x1', 0);
            divider.setAttribute('y1', 30);
            divider.setAttribute('x2', this.width);
            divider.setAttribute('y2', 30);
            divider.setAttribute('stroke', this.style.stroke);
            this.element.appendChild(divider);
        }

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = this.element.querySelector('.shape__body');
        if (rect) {
            rect.setAttribute('width', this.width);
            rect.setAttribute('height', this.height);
            rect.setAttribute('fill', this.style.fill);
            rect.setAttribute('stroke', this.style.stroke);
        }

        const text = this.element.querySelector('.shape__text');
        if (text) {
            text.setAttribute('x', this.width / 2);
            text.setAttribute('y', this.height / 2);
            text.textContent = this.properties.name;
        }

        const divider = this.element.querySelector('line');
        if (divider) {
            divider.setAttribute('x2', this.width);
        }

        // Update connection points
        const cpTop = this.element.querySelector('.connection-point--top');
        if (cpTop) cpTop.setAttribute('cx', this.width / 2);

        const cpRight = this.element.querySelector('.connection-point--right');
        if (cpRight) {
            cpRight.setAttribute('cx', this.width);
            cpRight.setAttribute('cy', this.height / 2);
        }

        const cpBottom = this.element.querySelector('.connection-point--bottom');
        if (cpBottom) {
            cpBottom.setAttribute('cx', this.width / 2);
            cpBottom.setAttribute('cy', this.height);
        }

        const cpLeft = this.element.querySelector('.connection-point--left');
        if (cpLeft) cpLeft.setAttribute('cy', this.height / 2);
    }
}

/**
 * Composite State
 */
export class CompositeState extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'composite',
            width: options.width || 200,
            height: options.height || 150
        });
        this.properties.name = options.name || 'Composite State';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-composite');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'shape__body');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', '12');
        rect.setAttribute('fill', this.style.fill);
        rect.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 10);
        text.setAttribute('y', 20);
        text.setAttribute('font-weight', 'bold');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        divider.setAttribute('x1', 0);
        divider.setAttribute('y1', 30);
        divider.setAttribute('x2', this.width);
        divider.setAttribute('y2', 30);
        divider.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(divider);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = this.element.querySelector('.shape__body');
        if (rect) {
            rect.setAttribute('width', this.width);
            rect.setAttribute('height', this.height);
            rect.setAttribute('fill', this.style.fill);
            rect.setAttribute('stroke', this.style.stroke);
        }

        const divider = this.element.querySelector('line');
        if (divider) {
            divider.setAttribute('x2', this.width);
        }

        // Text position is fixed at 10, 20
        const text = this.element.querySelector('text');
        if (text) {
            text.textContent = this.properties.name;
        }
    }
}

/**
 * Choice Pseudostate (diamond)
 */
export class ChoiceState extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'choice',
            width: options.width || 40,
            height: options.height || 40
        });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-choice');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const cx = this.width / 2;
        const cy = this.height / 2;
        diamond.setAttribute('points', `${cx},2 ${this.width - 2},${cy} ${cx},${this.height - 2} 2,${cy}`);
        diamond.setAttribute('fill', this.style.fill);
        diamond.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(diamond);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const diamond = this.element.querySelector('polygon');
        if (diamond) {
            const cx = this.width / 2;
            const cy = this.height / 2;
            diamond.setAttribute('points', `${cx},2 ${this.width - 2},${cy} ${cx},${this.height - 2} 2,${cy}`);
            diamond.setAttribute('fill', this.style.fill);
            diamond.setAttribute('stroke', this.style.stroke);
        }
    }
}

/**
 * Fork/Join Bar
 */
export class ForkJoinBar extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'forkjoin',
            width: options.width || 8,
            height: options.height || 80
        });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-forkjoin');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', '#333333');
        this.element.appendChild(rect);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = this.element.querySelector('rect');
        if (rect) {
            rect.setAttribute('width', this.width);
            rect.setAttribute('height', this.height);
        }
    }
}

/**
 * History State (H in circle)
 */
export class HistoryState extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'history',
            width: options.width || 30,
            height: options.height || 30
        });
        this.properties.deep = options.deep || false;
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-history');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', this.width / 2);
        circle.setAttribute('cy', this.height / 2);
        circle.setAttribute('r', this.width / 2 - 2);
        circle.setAttribute('fill', this.style.fill);
        circle.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-weight', 'bold');
        text.textContent = this.properties.deep ? 'H*' : 'H';
        this.element.appendChild(text);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const circle = this.element.querySelector('circle');
        if (circle) {
            circle.setAttribute('cx', this.width / 2);
            circle.setAttribute('cy', this.height / 2);
            circle.setAttribute('r', Math.min(this.width, this.height) / 2 - 2);
        }

        const text = this.element.querySelector('text');
        if (text) {
            text.setAttribute('x', this.width / 2);
            text.setAttribute('y', this.height / 2);
        }
    }
}

/**
 * State Diagram Plugin
 */
export class StatePlugin extends DiagramPlugin {
    get id() { return 'state'; }
    get name() { return 'State Diagram'; }
    get icon() { return 'state-icon'; }
    get color() { return '#8B5CF6'; }

    getShapeTools() {
        return [
            new ToolDefinition({
                id: 'initial',
                name: 'Initial State',
                icon: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>`,
                type: 'shape'
            }),
            new ToolDefinition({
                id: 'final',
                name: 'Final State',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>`,
                type: 'shape'
            }),
            new ToolDefinition({
                id: 'state',
                name: 'State',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="4"/></svg>`,
                type: 'shape'
            }),
            new ToolDefinition({
                id: 'composite',
                name: 'Composite State',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="4"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
                type: 'shape'
            }),
            new ToolDefinition({
                id: 'choice',
                name: 'Choice',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,3 21,12 12,21 3,12"/></svg>`,
                type: 'shape'
            }),
            new ToolDefinition({
                id: 'forkjoin',
                name: 'Fork/Join',
                icon: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="10" y="3" width="4" height="18" rx="1"/></svg>`,
                type: 'shape'
            }),
            new ToolDefinition({
                id: 'history',
                name: 'History',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">H</text></svg>`,
                type: 'shape'
            })
        ];
    }

    getConnectorTools() {
        return [
            new ToolDefinition({
                id: 'transition',
                name: 'Transition',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="18" y2="12"/><polygon points="21,12 15,8 15,16" fill="currentColor"/></svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'selfTransition',
                name: 'Self Transition',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6 L18 6 L18 12 L12 12"/><polygon points="12,12 15,9 15,15" fill="currentColor"/></svg>`,
                type: 'connector'
            })
        ];
    }

    getShapeDefinitions() {
        return {
            'initial': new ShapeDefinition({ type: 'initial', name: 'Initial', defaultWidth: 30, defaultHeight: 30 }),
            'final': new ShapeDefinition({ type: 'final', name: 'Final', defaultWidth: 30, defaultHeight: 30 }),
            'state': new ShapeDefinition({ type: 'state', name: 'State', defaultWidth: 120, defaultHeight: 60 }),
            'composite': new ShapeDefinition({ type: 'composite', name: 'Composite', defaultWidth: 200, defaultHeight: 150 }),
            'choice': new ShapeDefinition({ type: 'choice', name: 'Choice', defaultWidth: 40, defaultHeight: 40 }),
            'forkjoin': new ShapeDefinition({ type: 'forkjoin', name: 'Fork/Join', defaultWidth: 8, defaultHeight: 80 }),
            'history': new ShapeDefinition({ type: 'history', name: 'History', defaultWidth: 30, defaultHeight: 30 })
        };
    }

    getConnectorTypes() {
        return [
            new ConnectorDefinition({ type: 'transition', name: 'Transition', lineStyle: 'solid', targetArrow: 'filled' }),
            new ConnectorDefinition({ type: 'selfTransition', name: 'Self Transition', lineStyle: 'solid', targetArrow: 'filled' })
        ];
    }

    getPropertyEditors(element) {
        if (element.type === 'state') {
            return [
                { key: 'name', label: 'State Name', type: 'text' },
                { key: 'entryAction', label: 'Entry Action', type: 'text' },
                { key: 'exitAction', label: 'Exit Action', type: 'text' },
                { key: 'doActivity', label: 'Do Activity', type: 'text' }
            ];
        }
        return [];
    }

    onActivate() { console.log('State Diagram plugin activated'); }
    onDeactivate() { console.log('State Diagram plugin deactivated'); }
}

// Register shapes
ShapeFactory.register('initial', InitialState, { width: 30, height: 30 });
ShapeFactory.register('final', FinalState, { width: 30, height: 30 });
ShapeFactory.register('state', StateShape, { width: 120, height: 60 });
ShapeFactory.register('composite', CompositeState, { width: 200, height: 150 });
ShapeFactory.register('choice', ChoiceState, { width: 40, height: 40 });
ShapeFactory.register('forkjoin', ForkJoinBar, { width: 8, height: 80 });
ShapeFactory.register('history', HistoryState, { width: 30, height: 30 });
