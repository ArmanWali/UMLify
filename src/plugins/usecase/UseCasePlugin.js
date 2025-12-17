/**
 * Use Case Diagram Plugin
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Actor Shape for Use Case Diagrams
 */
export class UseCaseActor extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'ucActor',
            width: options.width || 50,
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
        head.setAttribute('cx', centerX);
        head.setAttribute('cy', 10);
        head.setAttribute('r', 8);
        head.setAttribute('fill', this.style.fill);
        head.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(head);

        // Body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.setAttribute('x1', centerX);
        body.setAttribute('y1', 18);
        body.setAttribute('x2', centerX);
        body.setAttribute('y2', 40);
        body.setAttribute('stroke', this.style.stroke);
        body.setAttribute('stroke-width', '2');
        this.element.appendChild(body);

        // Arms
        const arms = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arms.setAttribute('x1', centerX - 15);
        arms.setAttribute('y1', 28);
        arms.setAttribute('x2', centerX + 15);
        arms.setAttribute('y2', 28);
        arms.setAttribute('stroke', this.style.stroke);
        arms.setAttribute('stroke-width', '2');
        this.element.appendChild(arms);

        // Legs
        const leftLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLeg.setAttribute('x1', centerX);
        leftLeg.setAttribute('y1', 40);
        leftLeg.setAttribute('x2', centerX - 12);
        leftLeg.setAttribute('y2', 55);
        leftLeg.setAttribute('stroke', this.style.stroke);
        leftLeg.setAttribute('stroke-width', '2');
        this.element.appendChild(leftLeg);

        const rightLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightLeg.setAttribute('x1', centerX);
        rightLeg.setAttribute('y1', 40);
        rightLeg.setAttribute('x2', centerX + 12);
        rightLeg.setAttribute('y2', 55);
        rightLeg.setAttribute('stroke', this.style.stroke);
        rightLeg.setAttribute('stroke-width', '2');
        this.element.appendChild(rightLeg);

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', 72);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'shape__text');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        this.renderConnectionPoints(this.element);
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
        const head = this.element.querySelector('circle');
        if (head) {
            head.setAttribute('cx', centerX);
        }

        // Update body and limbs
        const lines = this.element.querySelectorAll('line');
        if (lines.length >= 4) {
            // Body
            lines[0].setAttribute('x1', centerX);
            lines[0].setAttribute('x2', centerX);

            // Arms
            lines[1].setAttribute('x1', centerX - 15);
            lines[1].setAttribute('x2', centerX + 15);

            // Left Leg
            lines[2].setAttribute('x1', centerX);
            lines[2].setAttribute('x2', centerX - 12);

            // Right Leg
            lines[3].setAttribute('x1', centerX);
            lines[3].setAttribute('x2', centerX + 12);
        }

        // Update name
        const text = this.element.querySelector('.shape__text');
        if (text) {
            text.setAttribute('x', centerX);
        }

        // Update connection points
        const cpTop = this.element.querySelector('.connection-point--top');
        if (cpTop) cpTop.setAttribute('cx', centerX);

        const cpRight = this.element.querySelector('.connection-point--right');
        if (cpRight) {
            cpRight.setAttribute('cx', this.width);
            cpRight.setAttribute('cy', this.height / 2);
        }

        const cpBottom = this.element.querySelector('.connection-point--bottom');
        if (cpBottom) {
            cpBottom.setAttribute('cx', centerX);
            cpBottom.setAttribute('cy', this.height);
        }

        const cpLeft = this.element.querySelector('.connection-point--left');
        if (cpLeft) cpLeft.setAttribute('cy', this.height / 2);
    }
}

/**
 * Use Case Shape (Oval)
 */
export class UseCaseShape extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'usecase',
            width: options.width || 140,
            height: options.height || 60
        });
        this.properties.name = options.name || 'Use Case';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-usecase');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Ellipse
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('class', 'shape__body');
        ellipse.setAttribute('cx', this.width / 2);
        ellipse.setAttribute('cy', this.height / 2);
        ellipse.setAttribute('rx', this.width / 2);
        ellipse.setAttribute('ry', this.height / 2);
        ellipse.setAttribute('fill', this.style.fill);
        ellipse.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(ellipse);

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('class', 'shape__text');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        this.renderConnectionPoints(this.element);
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

        // Update ellipse body
        const ellipse = this.element.querySelector('ellipse.shape__body');
        if (ellipse) {
            ellipse.setAttribute('cx', this.width / 2);
            ellipse.setAttribute('cy', this.height / 2);
            ellipse.setAttribute('rx', this.width / 2);
            ellipse.setAttribute('ry', this.height / 2);
            ellipse.setAttribute('fill', this.style.fill);
            ellipse.setAttribute('stroke', this.style.stroke);
        }

        // Update text position
        const text = this.element.querySelector('.shape__text');
        if (text) {
            text.setAttribute('x', this.width / 2);
            text.setAttribute('y', this.height / 2);
            text.textContent = this.properties.name;
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
 * System Boundary Shape
 */
export class SystemBoundary extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'system',
            width: options.width || 300,
            height: options.height || 400
        });
        this.properties.name = options.name || 'System';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-system');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Boundary rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'shape__body');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', this.style.stroke);
        rect.setAttribute('stroke-width', '2');
        this.element.appendChild(rect);

        // System name at top
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', 20);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('class', 'shape__text');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

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

        // Update body
        const body = this.element.querySelector('.shape__body');
        if (body) {
            body.setAttribute('width', this.width);
            body.setAttribute('height', this.height);
            body.setAttribute('fill', 'none');
            body.setAttribute('stroke', this.style.stroke);
        }

        // Update text position (centered horizontally, fixed top y)
        const text = this.element.querySelector('.shape__text');
        if (text) {
            text.setAttribute('x', this.width / 2);
            // y is fixed at 20
        }

        // Update connection points (if any - SystemBoundary doesn't call renderConnectionPoints in render()?)
        // Wait, render() DOES NOT call renderConnectionPoints!
        // But if I add them, I should update them.
        // Let's check render() again. It does NOT call renderConnectionPoints.
        // So SystemBoundary might not be connectable?
        // If it's not connectable, I don't need to update connection points.
        // But if I add them later, I should.
        // For now, I'll just update body and text.
    }
}

/**
 * Use Case Diagram Plugin
 */
export class UseCasePlugin extends DiagramPlugin {
    get id() { return 'usecase'; }
    get name() { return 'Use Case Diagram'; }
    get icon() { return 'usecase-icon'; }
    get color() { return '#F97316'; }

    getShapeTools() {
        return [
            new ToolDefinition({
                id: 'ucActor',
                name: 'Actor',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="5" r="3"/>
                    <line x1="12" y1="8" x2="12" y2="15"/>
                    <line x1="8" y1="11" x2="16" y2="11"/>
                    <line x1="12" y1="15" x2="8" y2="21"/>
                    <line x1="12" y1="15" x2="16" y2="21"/>
                </svg>`,
                type: 'shape'
            }),
            new ToolDefinition({
                id: 'usecase',
                name: 'Use Case',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <ellipse cx="12" cy="12" rx="10" ry="6"/>
                </svg>`,
                type: 'shape'
            }),
            new ToolDefinition({
                id: 'system',
                name: 'System',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18"/>
                </svg>`,
                type: 'shape'
            })
        ];
    }

    getConnectorTools() {
        return [
            new ToolDefinition({
                id: 'ucAssociation',
                name: 'Association',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                </svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'include',
                name: 'Include',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="4 2"/>
                    <polyline points="18,12 14,8"/>
                    <polyline points="18,12 14,16"/>
                </svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'extend',
                name: 'Extend',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="21" y1="12" x2="6" y2="12" stroke-dasharray="4 2"/>
                    <polyline points="6,12 10,8"/>
                    <polyline points="6,12 10,16"/>
                </svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'generalization',
                name: 'Generalization',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="21" x2="12" y2="8"/>
                    <polygon points="12,3 8,8 16,8" fill="none"/>
                </svg>`,
                type: 'connector'
            })
        ];
    }

    getConnectorTypes() {
        return [
            new ConnectorDefinition({ type: 'ucAssociation', name: 'Association', lineStyle: 'solid', targetArrow: 'none' }),
            new ConnectorDefinition({ type: 'include', name: 'Include', lineStyle: 'dashed', targetArrow: 'open' }),
            new ConnectorDefinition({ type: 'extend', name: 'Extend', lineStyle: 'dashed', targetArrow: 'open' }),
            new ConnectorDefinition({ type: 'generalization', name: 'Generalization', lineStyle: 'solid', targetArrow: 'triangle' })
        ];
    }

    getShapeDefinitions() {
        return {
            'ucActor': new ShapeDefinition({ type: 'ucActor', name: 'Actor', defaultWidth: 50, defaultHeight: 80 }),
            'usecase': new ShapeDefinition({ type: 'usecase', name: 'Use Case', defaultWidth: 140, defaultHeight: 60 }),
            'system': new ShapeDefinition({ type: 'system', name: 'System Boundary', defaultWidth: 300, defaultHeight: 400 })
        };
    }

    onActivate() { console.log('Use Case Diagram plugin activated'); }
    onDeactivate() { console.log('Use Case Diagram plugin deactivated'); }
}

ShapeFactory.register('ucActor', UseCaseActor, { width: 50, height: 80 });
ShapeFactory.register('usecase', UseCaseShape, { width: 140, height: 60 });
ShapeFactory.register('system', SystemBoundary, { width: 300, height: 400 });
