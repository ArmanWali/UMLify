/**
 * Sequence Diagram Plugin
 * Implements Strategy pattern for sequence diagram specific behavior
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { Connection } from '../../shapes/Connection.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Object Shape for Sequence Diagrams
 */
export class SequenceObject extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'object',
            width: options.width || 120,
            height: options.height || 50
        });
        this.properties.name = options.name || 'Object';
        this.properties.stereotype = options.stereotype || '';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-object');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Object box (rounded rectangle)
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('class', 'shape__body');
        body.setAttribute('width', this.width);
        body.setAttribute('height', this.height);
        body.setAttribute('fill', this.style.fill);
        body.setAttribute('stroke', this.style.stroke);
        body.setAttribute('stroke-width', this.style.strokeWidth);
        body.setAttribute('rx', '6');
        this.element.appendChild(body);

        // Object name with underline (instance notation)
        const textY = this.height / 2;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'shape__text shape__text--name');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('text-decoration', 'underline');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        // Stereotype if present
        if (this.properties.stereotype) {
            const stereotype = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            stereotype.setAttribute('class', 'shape__text shape__text--stereotype');
            stereotype.setAttribute('x', this.width / 2);
            stereotype.setAttribute('y', 12);
            stereotype.setAttribute('text-anchor', 'middle');
            stereotype.textContent = `«${this.properties.stereotype}»`;
            this.element.appendChild(stereotype);
        }

        // Lifeline (dashed vertical line)
        const lifeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lifeline.setAttribute('class', 'lifeline');
        lifeline.setAttribute('x1', this.width / 2);
        lifeline.setAttribute('y1', this.height);
        lifeline.setAttribute('x2', this.width / 2);
        lifeline.setAttribute('y2', this.height + 300); // Default length
        this.element.appendChild(lifeline);

        // Connection points
        this.renderConnectionPoints(this.element);

        container.appendChild(this.element);
        return this.element;
    }

    getConnectionPoints() {
        const midX = this.x + this.width / 2;
        return {
            top: { x: midX, y: this.y },
            bottom: { x: midX, y: this.y + this.height },
            left: { x: this.x, y: this.y + this.height / 2 },
            right: { x: this.x + this.width, y: this.y + this.height / 2 },
            // Lifeline points at various Y positions
            lifeline: (y) => ({ x: midX, y: y })
        };
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;

        // Update transform
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Update body
        const body = this.element.querySelector('.shape__body');
        if (body) {
            body.setAttribute('width', this.width);
            body.setAttribute('height', this.height);
            body.setAttribute('fill', this.style.fill);
            body.setAttribute('stroke', this.style.stroke);
        }

        // Update name
        const text = this.element.querySelector('.shape__text--name');
        if (text) {
            text.setAttribute('x', this.width / 2);
            text.setAttribute('y', this.height / 2);
            text.textContent = this.properties.name;
        }

        // Update stereotype
        const stereotype = this.element.querySelector('.shape__text--stereotype');
        if (stereotype) {
            stereotype.setAttribute('x', this.width / 2);
        }

        // Update lifeline
        const lifeline = this.element.querySelector('.lifeline');
        if (lifeline) {
            lifeline.setAttribute('x1', this.width / 2);
            lifeline.setAttribute('y1', this.height);
            lifeline.setAttribute('x2', this.width / 2);
            // Keep existing y2 or update it? 
            // Usually lifeline length is independent of object height, but starts at object bottom.
            // If object height changes, lifeline start (y1) changes.
            // We should preserve the length or just ensure it starts correctly.
            // For now, let's just update x1, y1, x2. y2 stays as is (absolute coordinate? No, relative to group).
            // Wait, y2 in render is `this.height + 300`.
            // If I resize object height, lifeline should shift down.
            // But y2 is relative to group (0,0).
            // So if I increase height by 10, y1 increases by 10. y2 should probably increase by 10 too to keep length constant?
            // Or just let y2 be.
            // Let's just update start point.
        }

        // Connection points are calculated dynamically in getConnectionPoints, so no DOM update needed for them?
        // Wait, render() calls renderConnectionPoints(this.element).
        // Base Shape.renderConnectionPoints adds circles.
        // So I DO need to update them if I want them to move visually.
        // SequenceObject overrides getConnectionPoints but uses base renderConnectionPoints?
        // No, SequenceObject calls `this.renderConnectionPoints(this.element)` in render.
        // Base Shape has `renderConnectionPoints`.
        // So yes, I need to update the circles.

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
 * Actor Shape for Sequence Diagrams
 */
export class SequenceActor extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'actor',
            width: options.width || 60,
            height: options.height || 80
        });
        this.properties.name = options.name || 'Actor';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-actor');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const centerX = this.width / 2;

        // Head
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        head.setAttribute('class', 'actor-head');
        head.setAttribute('cx', centerX);
        head.setAttribute('cy', 12);
        head.setAttribute('r', 10);
        head.setAttribute('fill', this.style.fill);
        head.setAttribute('stroke', this.style.stroke);
        head.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(head);

        // Body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.setAttribute('class', 'actor-body');
        body.setAttribute('x1', centerX);
        body.setAttribute('y1', 22);
        body.setAttribute('x2', centerX);
        body.setAttribute('y2', 45);
        body.setAttribute('stroke', this.style.stroke);
        body.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(body);

        // Arms
        const arms = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arms.setAttribute('class', 'actor-arms');
        arms.setAttribute('x1', centerX - 15);
        arms.setAttribute('y1', 32);
        arms.setAttribute('x2', centerX + 15);
        arms.setAttribute('y2', 32);
        arms.setAttribute('stroke', this.style.stroke);
        arms.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(arms);

        // Left leg
        const leftLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLeg.setAttribute('class', 'actor-legs');
        leftLeg.setAttribute('x1', centerX);
        leftLeg.setAttribute('y1', 45);
        leftLeg.setAttribute('x2', centerX - 12);
        leftLeg.setAttribute('y2', 60);
        leftLeg.setAttribute('stroke', this.style.stroke);
        leftLeg.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(leftLeg);

        // Right leg
        const rightLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightLeg.setAttribute('class', 'actor-legs');
        rightLeg.setAttribute('x1', centerX);
        rightLeg.setAttribute('y1', 45);
        rightLeg.setAttribute('x2', centerX + 12);
        rightLeg.setAttribute('y2', 60);
        rightLeg.setAttribute('stroke', this.style.stroke);
        rightLeg.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(rightLeg);

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'shape__text shape__text--name');
        text.setAttribute('x', centerX);
        text.setAttribute('y', 75);
        text.setAttribute('text-anchor', 'middle');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        // Lifeline
        const lifeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lifeline.setAttribute('class', 'lifeline');
        lifeline.setAttribute('x1', centerX);
        lifeline.setAttribute('y1', this.height);
        lifeline.setAttribute('x2', centerX);
        lifeline.setAttribute('y2', this.height + 300);
        this.element.appendChild(lifeline);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;

        // Update transform
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const centerX = this.width / 2;

        // Update head
        const head = this.element.querySelector('.actor-head');
        if (head) {
            head.setAttribute('cx', centerX);
        }

        // Update body
        const body = this.element.querySelector('.actor-body');
        if (body) {
            body.setAttribute('x1', centerX);
            body.setAttribute('x2', centerX);
        }

        // Update arms
        const arms = this.element.querySelector('.actor-arms');
        if (arms) {
            arms.setAttribute('x1', centerX - 15);
            arms.setAttribute('x2', centerX + 15);
        }

        // Update legs
        const legs = this.element.querySelectorAll('.actor-legs');
        if (legs.length >= 2) {
            // Left leg
            legs[0].setAttribute('x1', centerX);
            legs[0].setAttribute('x2', centerX - 12);
            // Right leg
            legs[1].setAttribute('x1', centerX);
            legs[1].setAttribute('x2', centerX + 12);
        }

        // Update name
        const text = this.element.querySelector('.shape__text--name');
        if (text) {
            text.setAttribute('x', centerX);
        }

        // Update lifeline
        const lifeline = this.element.querySelector('.lifeline');
        if (lifeline) {
            lifeline.setAttribute('x1', centerX);
            lifeline.setAttribute('y1', this.height);
            lifeline.setAttribute('x2', centerX);
        }
    }
}

/**
 * Activation Bar Shape
 */
export class ActivationBar extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'activation',
            width: options.width || 16,
            height: options.height || 60
        });
        this.parentObjectId = options.parentObjectId || null;
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-activation');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('class', 'activation-bar');
        body.setAttribute('width', this.width);
        body.setAttribute('height', this.height);
        body.setAttribute('fill', '#E8E8E8');
        body.setAttribute('stroke', this.style.stroke);
        body.setAttribute('stroke-width', '1');
        this.element.appendChild(body);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Combined Fragment (alt, opt, loop, break, par, etc.)
 */
export class CombinedFragment extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'fragment',
            width: options.width || 200,
            height: options.height || 120
        });
        this.properties.operator = options.operator || 'alt';
        this.properties.guard = options.guard || '[condition]';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-fragment');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Main rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('fill', 'rgba(255,255,255,0.5)');
        rect.setAttribute('stroke', this.style.stroke);
        rect.setAttribute('stroke-width', '1.5');
        this.element.appendChild(rect);

        // Operator label pentagon
        const labelWidth = 50;
        const labelHeight = 20;
        const pentagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        pentagon.setAttribute('points', `0,0 ${labelWidth},0 ${labelWidth},${labelHeight - 5} ${labelWidth - 8},${labelHeight} 0,${labelHeight}`);
        pentagon.setAttribute('fill', '#f5f5f5');
        pentagon.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(pentagon);

        // Operator text
        const opText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        opText.setAttribute('x', 5);
        opText.setAttribute('y', 14);
        opText.setAttribute('font-weight', 'bold');
        opText.setAttribute('font-size', '11');
        opText.textContent = this.properties.operator;
        this.element.appendChild(opText);

        // Guard condition
        const guardText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        guardText.setAttribute('x', 10);
        guardText.setAttribute('y', 35);
        guardText.setAttribute('font-size', '11');
        guardText.textContent = this.properties.guard;
        this.element.appendChild(guardText);

        // Dashed separator line (for alt fragments)
        if (this.properties.operator === 'alt') {
            const separator = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            separator.setAttribute('x1', 0);
            separator.setAttribute('y1', this.height / 2);
            separator.setAttribute('x2', this.width);
            separator.setAttribute('y2', this.height / 2);
            separator.setAttribute('stroke', this.style.stroke);
            separator.setAttribute('stroke-dasharray', '5 3');
            this.element.appendChild(separator);

            // Else guard
            const elseText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            elseText.setAttribute('x', 10);
            elseText.setAttribute('y', this.height / 2 + 15);
            elseText.setAttribute('font-size', '11');
            elseText.textContent = '[else]';
            this.element.appendChild(elseText);
        }

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Destroy marker (X symbol)
 */
export class DestroyMarker extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'destroy',
            width: options.width || 24,
            height: options.height || 24
        });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-destroy');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', 2);
        line1.setAttribute('y1', 2);
        line1.setAttribute('x2', 22);
        line1.setAttribute('y2', 22);
        line1.setAttribute('stroke', this.style.stroke);
        line1.setAttribute('stroke-width', '3');
        this.element.appendChild(line1);

        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', 22);
        line2.setAttribute('y1', 2);
        line2.setAttribute('x2', 2);
        line2.setAttribute('y2', 22);
        line2.setAttribute('stroke', this.style.stroke);
        line2.setAttribute('stroke-width', '3');
        this.element.appendChild(line2);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Found/Lost Message endpoint (filled circle)
 */
export class MessageEndpoint extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'endpoint',
            width: options.width || 16,
            height: options.height || 16
        });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-endpoint');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 8);
        circle.setAttribute('cy', 8);
        circle.setAttribute('r', 7);
        circle.setAttribute('fill', '#333');
        this.element.appendChild(circle);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Boundary/Entity/Control stereotyped objects
 */
export class BoundaryObject extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'boundary',
            width: options.width || 100,
            height: options.height || 50
        });
        this.properties.name = options.name || 'Boundary';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-boundary');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 30);
        circle.setAttribute('cy', 25);
        circle.setAttribute('r', 20);
        circle.setAttribute('fill', this.style.fill);
        circle.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(circle);

        // Vertical line on left
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', 5);
        vLine.setAttribute('y1', 10);
        vLine.setAttribute('x2', 5);
        vLine.setAttribute('y2', 40);
        vLine.setAttribute('stroke', this.style.stroke);
        vLine.setAttribute('stroke-width', '2');
        this.element.appendChild(vLine);

        // Horizontal line connecting
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', 5);
        hLine.setAttribute('y1', 25);
        hLine.setAttribute('x2', 10);
        hLine.setAttribute('y2', 25);
        hLine.setAttribute('stroke', this.style.stroke);
        hLine.setAttribute('stroke-width', '2');
        this.element.appendChild(hLine);

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 55);
        text.setAttribute('y', 28);
        text.setAttribute('font-size', '12');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Sequence Message Connection
 */
export class SequenceMessage extends Connection {
    constructor(options = {}) {
        super({
            ...options,
            type: options.type || 'syncMessage'
        });
        this.properties.label = options.label || '';
        this.properties.sequenceNumber = options.sequenceNumber || null;

        // Set style based on message type
        switch (this.type) {
            case 'syncMessage':
                this.style.lineStyle = 'solid';
                this.style.targetArrow = 'filled';
                break;
            case 'asyncMessage':
                this.style.lineStyle = 'solid';
                this.style.targetArrow = 'open';
                break;
            case 'returnMessage':
                this.style.lineStyle = 'dashed';
                this.style.targetArrow = 'open';
                break;
            case 'createMessage':
                this.style.lineStyle = 'dashed';
                this.style.targetArrow = 'open';
                break;
            case 'destroyMessage':
                this.style.lineStyle = 'solid';
                this.style.targetArrow = 'filled';
                break;
        }
    }
}

/**
 * Sequence Diagram Plugin
 */
export class SequencePlugin extends DiagramPlugin {
    constructor() {
        super();
    }

    get id() { return 'sequence'; }
    get name() { return 'Sequence Diagram'; }
    get icon() { return 'sequence-icon'; }
    get color() { return '#10B981'; }

    getShapeTools() {
        return [
            new ToolDefinition({
                id: 'object',
                name: 'Lifeline',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="10" rx="2"/>
                    <line x1="12" y1="13" x2="12" y2="21" stroke-dasharray="3 2"/>
                </svg>`,
                type: 'shape',
                shortcut: 'L'
            }),
            new ToolDefinition({
                id: 'actor',
                name: 'Actor',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="4" r="3"/>
                    <line x1="12" y1="7" x2="12" y2="14"/>
                    <line x1="8" y1="10" x2="16" y2="10"/>
                    <line x1="12" y1="14" x2="8" y2="20"/>
                    <line x1="12" y1="14" x2="16" y2="20"/>
                </svg>`,
                type: 'shape',
                shortcut: 'A'
            }),
            new ToolDefinition({
                id: 'activation',
                name: 'Activation',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="3" width="6" height="18" fill="#E8E8E8"/>
                </svg>`,
                type: 'shape',
                shortcut: 'B'
            }),
            new ToolDefinition({
                id: 'fragment',
                name: 'Fragment',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="4" width="20" height="16"/>
                    <polygon points="2,4 10,4 10,9 7,12 2,12"/>
                    <text x="4" y="10" font-size="6" fill="currentColor">alt</text>
                </svg>`,
                type: 'shape',
                shortcut: 'F'
            }),
            new ToolDefinition({
                id: 'destroy',
                name: 'Destroy',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="6" y1="6" x2="18" y2="18"/>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                </svg>`,
                type: 'shape',
                shortcut: 'X'
            }),
            new ToolDefinition({
                id: 'endpoint',
                name: 'Found/Lost',
                icon: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>`,
                type: 'shape',
                shortcut: 'E'
            }),
            new ToolDefinition({
                id: 'boundary',
                name: 'Boundary',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="14" cy="12" r="6"/>
                    <line x1="4" y1="6" x2="4" y2="18"/>
                    <line x1="4" y1="12" x2="8" y2="12"/>
                </svg>`,
                type: 'shape'
            })
        ];
    }

    getConnectorTools() {
        return [
            new ToolDefinition({
                id: 'syncMessage',
                name: 'Sync Message',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="18" y2="12"/>
                    <polygon points="21,12 15,8 15,16" fill="currentColor"/>
                </svg>`,
                type: 'connector',
                shortcut: 'M'
            }),
            new ToolDefinition({
                id: 'asyncMessage',
                name: 'Async Message',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="18" y2="12"/>
                    <polyline points="18,12 14,8" fill="none"/>
                    <polyline points="18,12 14,16" fill="none"/>
                </svg>`,
                type: 'connector',
                shortcut: 'N'
            }),
            new ToolDefinition({
                id: 'returnMessage',
                name: 'Return',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="21" y1="12" x2="6" y2="12" stroke-dasharray="4 2"/>
                    <polyline points="6,12 10,8"/>
                    <polyline points="6,12 10,16"/>
                </svg>`,
                type: 'connector',
                shortcut: 'R'
            }),
            new ToolDefinition({
                id: 'selfMessage',
                name: 'Self Call',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 6 L18 6 L18 12 L12 12"/>
                    <polygon points="12,12 15,9 15,15" fill="currentColor"/>
                </svg>`,
                type: 'connector',
                shortcut: 'S'
            })
        ];
    }

    getShapeDefinitions() {
        return {
            'object': new ShapeDefinition({
                type: 'object',
                name: 'Lifeline',
                defaultWidth: 120,
                defaultHeight: 50,
                connectionPoints: ['left', 'right', 'bottom']
            }),
            'actor': new ShapeDefinition({
                type: 'actor',
                name: 'Actor',
                defaultWidth: 60,
                defaultHeight: 80,
                connectionPoints: ['bottom']
            }),
            'activation': new ShapeDefinition({
                type: 'activation',
                name: 'Activation Bar',
                defaultWidth: 16,
                defaultHeight: 60,
                connectionPoints: ['left', 'right']
            }),
            'fragment': new ShapeDefinition({
                type: 'fragment',
                name: 'Combined Fragment',
                defaultWidth: 200,
                defaultHeight: 120
            }),
            'destroy': new ShapeDefinition({
                type: 'destroy',
                name: 'Destroy',
                defaultWidth: 24,
                defaultHeight: 24
            }),
            'endpoint': new ShapeDefinition({
                type: 'endpoint',
                name: 'Found/Lost Message',
                defaultWidth: 16,
                defaultHeight: 16
            }),
            'boundary': new ShapeDefinition({
                type: 'boundary',
                name: 'Boundary Object',
                defaultWidth: 100,
                defaultHeight: 50
            })
        };
    }

    getConnectorTypes() {
        return [
            new ConnectorDefinition({
                type: 'syncMessage',
                name: 'Synchronous Message',
                lineStyle: 'solid',
                targetArrow: 'filled',
                validSources: ['object', 'actor', 'activation'],
                validTargets: ['object', 'actor', 'activation']
            }),
            new ConnectorDefinition({
                type: 'asyncMessage',
                name: 'Asynchronous Message',
                lineStyle: 'solid',
                targetArrow: 'open',
                validSources: ['object', 'actor', 'activation'],
                validTargets: ['object', 'actor', 'activation']
            }),
            new ConnectorDefinition({
                type: 'returnMessage',
                name: 'Return Message',
                lineStyle: 'dashed',
                targetArrow: 'open',
                validSources: ['object', 'actor', 'activation'],
                validTargets: ['object', 'actor', 'activation']
            })
        ];
    }

    validateConnection(sourceShape, targetShape, connectorType) {
        // Sequence messages typically go between different objects
        if (connectorType !== 'selfMessage' && sourceShape.id === targetShape.id) {
            return { valid: false, message: 'Use self-call for messages to same object' };
        }
        return { valid: true };
    }

    renderShape(shape, container) {
        switch (shape.type) {
            case 'object':
                return new SequenceObject(shape).render(container);
            case 'actor':
                return new SequenceActor(shape).render(container);
            case 'activation':
                return new ActivationBar(shape).render(container);
            default:
                return shape.render(container);
        }
    }

    renderConnector(connection, container) {
        return connection.render(container);
    }

    getPropertyEditors(element) {
        if (element.type === 'object') {
            return [
                { key: 'name', label: 'Object Name', type: 'text' },
                { key: 'stereotype', label: 'Stereotype', type: 'text' }
            ];
        }
        if (element.type === 'actor') {
            return [
                { key: 'name', label: 'Actor Name', type: 'text' }
            ];
        }
        if (element instanceof Connection) {
            return [
                { key: 'label', label: 'Message', type: 'text' },
                { key: 'sequenceNumber', label: 'Sequence #', type: 'text' }
            ];
        }
        return [];
    }

    onActivate() {
        console.log('Sequence Diagram plugin activated');
    }

    onDeactivate() {
        console.log('Sequence Diagram plugin deactivated');
    }
}

// Register shapes with factory
ShapeFactory.register('object', SequenceObject, { width: 120, height: 50 });
ShapeFactory.register('actor', SequenceActor, { width: 60, height: 80 });
ShapeFactory.register('activation', ActivationBar, { width: 16, height: 60 });
ShapeFactory.register('fragment', CombinedFragment, { width: 200, height: 120 });
ShapeFactory.register('destroy', DestroyMarker, { width: 24, height: 24 });
ShapeFactory.register('endpoint', MessageEndpoint, { width: 16, height: 16 });
ShapeFactory.register('boundary', BoundaryObject, { width: 100, height: 50 });
