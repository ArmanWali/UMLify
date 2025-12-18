/**
 * Sequence Diagram Plugin
 * Implements Strategy pattern for sequence diagram specific behavior
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { Connection } from '../../shapes/Connection.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Object Shape for Sequence Diagrams (Lifeline)
 */
export class SequenceObject extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'object',
            width: options.width || 120,
            height: options.height || 50,
            minWidth: 60,
            minHeight: 30
        });
        this.properties.name = options.name || 'Object';
        this.properties.stereotype = options.stereotype || '';
        // Store lifeline length separately so it can be adjusted
        this.lifelineLength = options.lifelineLength || 300;
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
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'shape__text shape__text--name');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2);
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
        lifeline.setAttribute('y2', this.height + this.lifelineLength);
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
            center: { x: midX, y: this.y + this.height / 2 }
        };
    }

    /**
     * Get connection point at a specific Y coordinate on the lifeline
     * This allows messages to connect at any point along the lifeline
     */
    getLifelineConnectionPoint(targetY) {
        const centerX = this.x + this.width / 2;
        const lifelineStart = this.y + this.height;
        const lifelineEnd = lifelineStart + this.lifelineLength;
        
        // Clamp Y to lifeline range
        const clampedY = Math.max(lifelineStart, Math.min(targetY, lifelineEnd));
        return { x: centerX, y: clampedY };
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
            lifeline.setAttribute('y2', this.height + this.lifelineLength);
        }

        // Update connection points
        const cpTop = this.element.querySelector('.connection-point--top');
        if (cpTop) {
            cpTop.setAttribute('cx', this.width / 2);
            cpTop.setAttribute('cy', 0);
        }

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
        if (cpLeft) {
            cpLeft.setAttribute('cx', 0);
            cpLeft.setAttribute('cy', this.height / 2);
        }
    }
}

/**
 * Actor Shape for Sequence Diagrams
 * Scales proportionally with width/height
 */
export class SequenceActor extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'actor',
            width: options.width || 60,
            height: options.height || 80,
            minWidth: 40,
            minHeight: 60
        });
        this.properties.name = options.name || 'Actor';
        // Store lifeline length separately
        this.lifelineLength = options.lifelineLength || 300;
    }

    // Calculate scaled dimensions based on current width/height
    getScaledDimensions() {
        const baseWidth = 60;
        const baseHeight = 80;
        const scaleX = this.width / baseWidth;
        const scaleY = this.height / baseHeight;
        
        const centerX = this.width / 2;
        const headRadius = 10 * Math.min(scaleX, scaleY);
        const headY = 12 * scaleY;
        const bodyTopY = (12 + 10) * scaleY; // After head
        const bodyBottomY = 45 * scaleY;
        const armsY = 32 * scaleY;
        const armSpan = 15 * scaleX;
        const legBottomY = 60 * scaleY;
        const legSpread = 12 * scaleX;
        const nameY = Math.min(75 * scaleY, this.height - 5);
        
        return {
            centerX,
            headRadius,
            headY,
            bodyTopY,
            bodyBottomY,
            armsY,
            armSpan,
            legBottomY,
            legSpread,
            nameY,
            scaleX,
            scaleY
        };
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-actor');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const dims = this.getScaledDimensions();

        // Head
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        head.setAttribute('class', 'actor-head shape__body');
        head.setAttribute('cx', dims.centerX);
        head.setAttribute('cy', dims.headY);
        head.setAttribute('r', dims.headRadius);
        head.setAttribute('fill', this.style.fill);
        head.setAttribute('stroke', this.style.stroke);
        head.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(head);

        // Body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.setAttribute('class', 'actor-body');
        body.setAttribute('x1', dims.centerX);
        body.setAttribute('y1', dims.bodyTopY);
        body.setAttribute('x2', dims.centerX);
        body.setAttribute('y2', dims.bodyBottomY);
        body.setAttribute('stroke', this.style.stroke);
        body.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(body);

        // Arms
        const arms = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arms.setAttribute('class', 'actor-arms');
        arms.setAttribute('x1', dims.centerX - dims.armSpan);
        arms.setAttribute('y1', dims.armsY);
        arms.setAttribute('x2', dims.centerX + dims.armSpan);
        arms.setAttribute('y2', dims.armsY);
        arms.setAttribute('stroke', this.style.stroke);
        arms.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(arms);

        // Left leg
        const leftLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLeg.setAttribute('class', 'actor-leg-left');
        leftLeg.setAttribute('x1', dims.centerX);
        leftLeg.setAttribute('y1', dims.bodyBottomY);
        leftLeg.setAttribute('x2', dims.centerX - dims.legSpread);
        leftLeg.setAttribute('y2', dims.legBottomY);
        leftLeg.setAttribute('stroke', this.style.stroke);
        leftLeg.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(leftLeg);

        // Right leg
        const rightLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightLeg.setAttribute('class', 'actor-leg-right');
        rightLeg.setAttribute('x1', dims.centerX);
        rightLeg.setAttribute('y1', dims.bodyBottomY);
        rightLeg.setAttribute('x2', dims.centerX + dims.legSpread);
        rightLeg.setAttribute('y2', dims.legBottomY);
        rightLeg.setAttribute('stroke', this.style.stroke);
        rightLeg.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(rightLeg);

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'shape__text shape__text--name');
        text.setAttribute('x', dims.centerX);
        text.setAttribute('y', dims.nameY);
        text.setAttribute('text-anchor', 'middle');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        // Lifeline (dashed vertical line extending from bottom)
        const lifeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lifeline.setAttribute('class', 'lifeline');
        lifeline.setAttribute('x1', dims.centerX);
        lifeline.setAttribute('y1', this.height);
        lifeline.setAttribute('x2', dims.centerX);
        lifeline.setAttribute('y2', this.height + this.lifelineLength);
        this.element.appendChild(lifeline);

        // Add connection points
        this.renderConnectionPoints(this.element);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Update element to match current state - properly scales all elements
     */
    updateElement() {
        if (!this.element) return;

        // Update transform
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const dims = this.getScaledDimensions();

        // Update head
        const head = this.element.querySelector('.actor-head');
        if (head) {
            head.setAttribute('cx', dims.centerX);
            head.setAttribute('cy', dims.headY);
            head.setAttribute('r', dims.headRadius);
        }

        // Update body
        const body = this.element.querySelector('.actor-body');
        if (body) {
            body.setAttribute('x1', dims.centerX);
            body.setAttribute('y1', dims.bodyTopY);
            body.setAttribute('x2', dims.centerX);
            body.setAttribute('y2', dims.bodyBottomY);
        }

        // Update arms
        const arms = this.element.querySelector('.actor-arms');
        if (arms) {
            arms.setAttribute('x1', dims.centerX - dims.armSpan);
            arms.setAttribute('y1', dims.armsY);
            arms.setAttribute('x2', dims.centerX + dims.armSpan);
            arms.setAttribute('y2', dims.armsY);
        }

        // Update left leg
        const leftLeg = this.element.querySelector('.actor-leg-left');
        if (leftLeg) {
            leftLeg.setAttribute('x1', dims.centerX);
            leftLeg.setAttribute('y1', dims.bodyBottomY);
            leftLeg.setAttribute('x2', dims.centerX - dims.legSpread);
            leftLeg.setAttribute('y2', dims.legBottomY);
        }

        // Update right leg
        const rightLeg = this.element.querySelector('.actor-leg-right');
        if (rightLeg) {
            rightLeg.setAttribute('x1', dims.centerX);
            rightLeg.setAttribute('y1', dims.bodyBottomY);
            rightLeg.setAttribute('x2', dims.centerX + dims.legSpread);
            rightLeg.setAttribute('y2', dims.legBottomY);
        }

        // Update name
        const text = this.element.querySelector('.shape__text--name');
        if (text) {
            text.setAttribute('x', dims.centerX);
            text.setAttribute('y', dims.nameY);
            text.textContent = this.properties.name;
        }

        // Update lifeline
        const lifeline = this.element.querySelector('.lifeline');
        if (lifeline) {
            lifeline.setAttribute('x1', dims.centerX);
            lifeline.setAttribute('y1', this.height);
            lifeline.setAttribute('x2', dims.centerX);
            lifeline.setAttribute('y2', this.height + this.lifelineLength);
        }

        // Update connection points
        const cpTop = this.element.querySelector('.connection-point--top');
        if (cpTop) {
            cpTop.setAttribute('cx', dims.centerX);
            cpTop.setAttribute('cy', 0);
        }
        const cpBottom = this.element.querySelector('.connection-point--bottom');
        if (cpBottom) {
            cpBottom.setAttribute('cx', dims.centerX);
            cpBottom.setAttribute('cy', this.height);
        }
        const cpLeft = this.element.querySelector('.connection-point--left');
        if (cpLeft) {
            cpLeft.setAttribute('cx', 0);
            cpLeft.setAttribute('cy', this.height / 2);
        }
        const cpRight = this.element.querySelector('.connection-point--right');
        if (cpRight) {
            cpRight.setAttribute('cx', this.width);
            cpRight.setAttribute('cy', this.height / 2);
        }
    }

    /**
     * Get connection point at a specific Y coordinate on the lifeline
     * This allows messages to connect at any point along the lifeline
     */
    getLifelineConnectionPoint(targetY) {
        const centerX = this.x + this.width / 2;
        const lifelineStart = this.y + this.height;
        const lifelineEnd = lifelineStart + this.lifelineLength;
        
        // Clamp Y to lifeline range
        const clampedY = Math.max(lifelineStart, Math.min(targetY, lifelineEnd));
        return { x: centerX, y: clampedY };
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
            height: options.height || 60,
            minWidth: 10,
            minHeight: 20
        });
        this.parentObjectId = options.parentObjectId || null;
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-activation');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('class', 'shape__body activation-bar');
        body.setAttribute('width', this.width);
        body.setAttribute('height', this.height);
        body.setAttribute('fill', '#E8E8E8');
        body.setAttribute('stroke', this.style.stroke);
        body.setAttribute('stroke-width', '1');
        this.element.appendChild(body);

        // Add connection points on left and right
        this.renderConnectionPoints(this.element);

        container.appendChild(this.element);
        return this.element;
    }

    updateElement() {
        if (!this.element) return;

        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const body = this.element.querySelector('.shape__body');
        if (body) {
            body.setAttribute('width', this.width);
            body.setAttribute('height', this.height);
        }

        // Update connection points
        const cpLeft = this.element.querySelector('.connection-point--left');
        if (cpLeft) {
            cpLeft.setAttribute('cx', 0);
            cpLeft.setAttribute('cy', this.height / 2);
        }
        const cpRight = this.element.querySelector('.connection-point--right');
        if (cpRight) {
            cpRight.setAttribute('cx', this.width);
            cpRight.setAttribute('cy', this.height / 2);
        }
    }

    /**
     * Get connection point at a specific Y coordinate
     */
    getConnectionPointAtY(targetY, side = 'left') {
        const clampedY = Math.max(this.y, Math.min(targetY, this.y + this.height));
        const x = side === 'left' ? this.x : this.x + this.width;
        return { x, y: clampedY };
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
            height: options.height || 120,
            minWidth: 100,
            minHeight: 60
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
        rect.setAttribute('class', 'shape__body fragment-body');
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
        pentagon.setAttribute('class', 'fragment-label');
        pentagon.setAttribute('points', `0,0 ${labelWidth},0 ${labelWidth},${labelHeight - 5} ${labelWidth - 8},${labelHeight} 0,${labelHeight}`);
        pentagon.setAttribute('fill', '#f5f5f5');
        pentagon.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(pentagon);

        // Operator text
        const opText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        opText.setAttribute('class', 'fragment-operator');
        opText.setAttribute('x', 5);
        opText.setAttribute('y', 14);
        opText.setAttribute('font-weight', 'bold');
        opText.setAttribute('font-size', '11');
        opText.textContent = this.properties.operator;
        this.element.appendChild(opText);

        // Guard condition
        const guardText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        guardText.setAttribute('class', 'fragment-guard shape__text--name');
        guardText.setAttribute('x', 10);
        guardText.setAttribute('y', 35);
        guardText.setAttribute('font-size', '11');
        guardText.textContent = this.properties.guard;
        this.element.appendChild(guardText);

        // Dashed separator line (for alt fragments)
        if (this.properties.operator === 'alt') {
            const separator = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            separator.setAttribute('class', 'fragment-separator');
            separator.setAttribute('x1', 0);
            separator.setAttribute('y1', this.height / 2);
            separator.setAttribute('x2', this.width);
            separator.setAttribute('y2', this.height / 2);
            separator.setAttribute('stroke', this.style.stroke);
            separator.setAttribute('stroke-dasharray', '5 3');
            this.element.appendChild(separator);

            // Else guard
            const elseText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            elseText.setAttribute('class', 'fragment-else');
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

    updateElement() {
        if (!this.element) return;

        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const body = this.element.querySelector('.fragment-body');
        if (body) {
            body.setAttribute('width', this.width);
            body.setAttribute('height', this.height);
        }

        const separator = this.element.querySelector('.fragment-separator');
        if (separator) {
            separator.setAttribute('y1', this.height / 2);
            separator.setAttribute('x2', this.width);
            separator.setAttribute('y2', this.height / 2);
        }

        const elseText = this.element.querySelector('.fragment-else');
        if (elseText) {
            elseText.setAttribute('y', this.height / 2 + 15);
        }

        // Update connection points
        const cpTop = this.element.querySelector('.connection-point--top');
        if (cpTop) {
            cpTop.setAttribute('cx', this.width / 2);
            cpTop.setAttribute('cy', 0);
        }
        const cpBottom = this.element.querySelector('.connection-point--bottom');
        if (cpBottom) {
            cpBottom.setAttribute('cx', this.width / 2);
            cpBottom.setAttribute('cy', this.height);
        }
        const cpLeft = this.element.querySelector('.connection-point--left');
        if (cpLeft) {
            cpLeft.setAttribute('cx', 0);
            cpLeft.setAttribute('cy', this.height / 2);
        }
        const cpRight = this.element.querySelector('.connection-point--right');
        if (cpRight) {
            cpRight.setAttribute('cx', this.width);
            cpRight.setAttribute('cy', this.height / 2);
        }
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
            height: options.height || 24,
            minWidth: 16,
            minHeight: 16
        });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-destroy');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const padding = 2;
        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('class', 'destroy-line1');
        line1.setAttribute('x1', padding);
        line1.setAttribute('y1', padding);
        line1.setAttribute('x2', this.width - padding);
        line1.setAttribute('y2', this.height - padding);
        line1.setAttribute('stroke', this.style.stroke);
        line1.setAttribute('stroke-width', '3');
        this.element.appendChild(line1);

        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('class', 'destroy-line2');
        line2.setAttribute('x1', this.width - padding);
        line2.setAttribute('y1', padding);
        line2.setAttribute('x2', padding);
        line2.setAttribute('y2', this.height - padding);
        line2.setAttribute('stroke', this.style.stroke);
        line2.setAttribute('stroke-width', '3');
        this.element.appendChild(line2);

        container.appendChild(this.element);
        return this.element;
    }

    updateElement() {
        if (!this.element) return;

        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const padding = 2;
        const line1 = this.element.querySelector('.destroy-line1');
        if (line1) {
            line1.setAttribute('x1', padding);
            line1.setAttribute('y1', padding);
            line1.setAttribute('x2', this.width - padding);
            line1.setAttribute('y2', this.height - padding);
        }

        const line2 = this.element.querySelector('.destroy-line2');
        if (line2) {
            line2.setAttribute('x1', this.width - padding);
            line2.setAttribute('y1', padding);
            line2.setAttribute('x2', padding);
            line2.setAttribute('y2', this.height - padding);
        }
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
            height: options.height || 16,
            minWidth: 10,
            minHeight: 10
        });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-endpoint');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const radius = Math.min(this.width, this.height) / 2 - 1;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'shape__body endpoint-circle');
        circle.setAttribute('cx', this.width / 2);
        circle.setAttribute('cy', this.height / 2);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', '#333');
        this.element.appendChild(circle);

        container.appendChild(this.element);
        return this.element;
    }

    updateElement() {
        if (!this.element) return;

        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const radius = Math.min(this.width, this.height) / 2 - 1;
        const circle = this.element.querySelector('.endpoint-circle');
        if (circle) {
            circle.setAttribute('cx', this.width / 2);
            circle.setAttribute('cy', this.height / 2);
            circle.setAttribute('r', radius);
        }
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
            height: options.height || 50,
            minWidth: 60,
            minHeight: 30
        });
        this.properties.name = options.name || 'Boundary';
        this.lifelineLength = options.lifelineLength || 300;
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-boundary');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Scale factors
        const scaleX = this.width / 100;
        const scaleY = this.height / 50;
        
        // Circle - scaled
        const circleRadius = Math.min(20 * scaleX, 20 * scaleY);
        const circleCx = 10 + circleRadius;
        const circleCy = this.height / 2;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'boundary-circle shape__body');
        circle.setAttribute('cx', circleCx);
        circle.setAttribute('cy', circleCy);
        circle.setAttribute('r', circleRadius);
        circle.setAttribute('fill', this.style.fill);
        circle.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(circle);

        // Vertical line on left - scaled
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('class', 'boundary-vline');
        vLine.setAttribute('x1', 5 * scaleX);
        vLine.setAttribute('y1', this.height * 0.2);
        vLine.setAttribute('x2', 5 * scaleX);
        vLine.setAttribute('y2', this.height * 0.8);
        vLine.setAttribute('stroke', this.style.stroke);
        vLine.setAttribute('stroke-width', '2');
        this.element.appendChild(vLine);

        // Horizontal line connecting - scaled
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('class', 'boundary-hline');
        hLine.setAttribute('x1', 5 * scaleX);
        hLine.setAttribute('y1', circleCy);
        hLine.setAttribute('x2', circleCx - circleRadius);
        hLine.setAttribute('y2', circleCy);
        hLine.setAttribute('stroke', this.style.stroke);
        hLine.setAttribute('stroke-width', '2');
        this.element.appendChild(hLine);

        // Name - positioned after circle
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'shape__text shape__text--name');
        text.setAttribute('x', circleCx + circleRadius + 5);
        text.setAttribute('y', circleCy + 4);
        text.setAttribute('font-size', '12');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        // Lifeline
        const lifeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lifeline.setAttribute('class', 'lifeline');
        lifeline.setAttribute('x1', this.width / 2);
        lifeline.setAttribute('y1', this.height);
        lifeline.setAttribute('x2', this.width / 2);
        lifeline.setAttribute('y2', this.height + this.lifelineLength);
        this.element.appendChild(lifeline);

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }

    updateElement() {
        if (!this.element) return;

        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const scaleX = this.width / 100;
        const scaleY = this.height / 50;
        const circleRadius = Math.min(20 * scaleX, 20 * scaleY);
        const circleCx = 10 + circleRadius;
        const circleCy = this.height / 2;

        const circle = this.element.querySelector('.boundary-circle');
        if (circle) {
            circle.setAttribute('cx', circleCx);
            circle.setAttribute('cy', circleCy);
            circle.setAttribute('r', circleRadius);
        }

        const vLine = this.element.querySelector('.boundary-vline');
        if (vLine) {
            vLine.setAttribute('x1', 5 * scaleX);
            vLine.setAttribute('y1', this.height * 0.2);
            vLine.setAttribute('x2', 5 * scaleX);
            vLine.setAttribute('y2', this.height * 0.8);
        }

        const hLine = this.element.querySelector('.boundary-hline');
        if (hLine) {
            hLine.setAttribute('x1', 5 * scaleX);
            hLine.setAttribute('y1', circleCy);
            hLine.setAttribute('x2', circleCx - circleRadius);
            hLine.setAttribute('y2', circleCy);
        }

        const text = this.element.querySelector('.shape__text--name');
        if (text) {
            text.setAttribute('x', circleCx + circleRadius + 5);
            text.setAttribute('y', circleCy + 4);
            text.textContent = this.properties.name;
        }

        const lifeline = this.element.querySelector('.lifeline');
        if (lifeline) {
            lifeline.setAttribute('x1', this.width / 2);
            lifeline.setAttribute('y1', this.height);
            lifeline.setAttribute('x2', this.width / 2);
            lifeline.setAttribute('y2', this.height + this.lifelineLength);
        }

        // Update connection points
        const cpTop = this.element.querySelector('.connection-point--top');
        if (cpTop) {
            cpTop.setAttribute('cx', this.width / 2);
            cpTop.setAttribute('cy', 0);
        }
        const cpBottom = this.element.querySelector('.connection-point--bottom');
        if (cpBottom) {
            cpBottom.setAttribute('cx', this.width / 2);
            cpBottom.setAttribute('cy', this.height);
        }
        const cpLeft = this.element.querySelector('.connection-point--left');
        if (cpLeft) {
            cpLeft.setAttribute('cx', 0);
            cpLeft.setAttribute('cy', this.height / 2);
        }
        const cpRight = this.element.querySelector('.connection-point--right');
        if (cpRight) {
            cpRight.setAttribute('cx', this.width);
            cpRight.setAttribute('cy', this.height / 2);
        }
    }

    getLifelineConnectionPoint(targetY) {
        const centerX = this.x + this.width / 2;
        const lifelineStart = this.y + this.height;
        const lifelineEnd = lifelineStart + this.lifelineLength;
        const clampedY = Math.max(lifelineStart, Math.min(targetY, lifelineEnd));
        return { x: centerX, y: clampedY };
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
