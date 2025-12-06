/**
 * Component Diagram Plugin
 * UML Component Diagram elements
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Component Shape
 */
export class ComponentShape extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'component', width: 140, height: 80 });
        this.properties.name = options.name || 'Component';
        this.properties.stereotype = options.stereotype || '';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-component');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Main rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('fill', this.style.fill);
        rect.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(rect);

        // Component icon (two small rectangles on left)
        const tab1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tab1.setAttribute('x', -8);
        tab1.setAttribute('y', 15);
        tab1.setAttribute('width', 16);
        tab1.setAttribute('height', 10);
        tab1.setAttribute('fill', this.style.fill);
        tab1.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(tab1);

        const tab2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tab2.setAttribute('x', -8);
        tab2.setAttribute('y', 35);
        tab2.setAttribute('width', 16);
        tab2.setAttribute('height', 10);
        tab2.setAttribute('fill', this.style.fill);
        tab2.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(tab2);

        // Stereotype
        let textY = 25;
        if (this.properties.stereotype) {
            const stereotype = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            stereotype.setAttribute('x', this.width / 2);
            stereotype.setAttribute('y', 20);
            stereotype.setAttribute('text-anchor', 'middle');
            stereotype.setAttribute('font-size', '11');
            stereotype.setAttribute('fill', '#666');
            stereotype.textContent = `«${this.properties.stereotype}»`;
            this.element.appendChild(stereotype);
            textY = 40;
        }

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.properties.stereotype ? 40 : this.height / 2 + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-weight', 'bold');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Interface (Lollipop)
 */
export class InterfaceLollipop extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'interface', width: 60, height: 40 });
        this.properties.name = options.name || 'IInterface';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-interface');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 30);
        circle.setAttribute('cy', 10);
        circle.setAttribute('r', 8);
        circle.setAttribute('fill', this.style.fill);
        circle.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(circle);

        // Stem
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 30);
        line.setAttribute('y1', 18);
        line.setAttribute('x2', 30);
        line.setAttribute('y2', 28);
        line.setAttribute('stroke', this.style.stroke);
        line.setAttribute('stroke-width', '2');
        this.element.appendChild(line);

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 30);
        text.setAttribute('y', 38);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Port
 */
export class PortShape extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'port', width: 16, height: 16 });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-port');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', 16);
        rect.setAttribute('height', 16);
        rect.setAttribute('fill', this.style.fill);
        rect.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(rect);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Provided Interface (socket)
 */
export class ProvidedInterface extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'provided', width: 30, height: 30 });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-provided');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Half circle (socket)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 15 5 A 10 10 0 0 1 15 25');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', this.style.stroke);
        path.setAttribute('stroke-width', '2');
        this.element.appendChild(path);

        // Line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', 15);
        line.setAttribute('x2', 15);
        line.setAttribute('y2', 15);
        line.setAttribute('stroke', this.style.stroke);
        line.setAttribute('stroke-width', '2');
        this.element.appendChild(line);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Required Interface (ball)
 */
export class RequiredInterface extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'required', width: 30, height: 30 });
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-required');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 22);
        circle.setAttribute('cy', 15);
        circle.setAttribute('r', 6);
        circle.setAttribute('fill', this.style.fill);
        circle.setAttribute('stroke', this.style.stroke);
        circle.setAttribute('stroke-width', '2');
        this.element.appendChild(circle);

        // Line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', 15);
        line.setAttribute('x2', 16);
        line.setAttribute('y2', 15);
        line.setAttribute('stroke', this.style.stroke);
        line.setAttribute('stroke-width', '2');
        this.element.appendChild(line);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Artifact
 */
export class ArtifactShape extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'artifact', width: 100, height: 70 });
        this.properties.name = options.name || 'artifact.jar';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-artifact');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Document shape with folded corner
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M 0 0 L 80 0 L 100 20 L 100 70 L 0 70 Z`);
        path.setAttribute('fill', this.style.fill);
        path.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(path);

        // Folded corner
        const corner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        corner.setAttribute('d', 'M 80 0 L 80 20 L 100 20');
        corner.setAttribute('fill', '#f0f0f0');
        corner.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(corner);

        // Stereotype
        const stereotype = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        stereotype.setAttribute('x', 50);
        stereotype.setAttribute('y', 32);
        stereotype.setAttribute('text-anchor', 'middle');
        stereotype.setAttribute('font-size', '10');
        stereotype.setAttribute('fill', '#666');
        stereotype.textContent = '«artifact»';
        this.element.appendChild(stereotype);

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 50);
        text.setAttribute('y', 50);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        this.renderConnectionPoints(this.element);
        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Component Diagram Plugin
 */
export class ComponentPlugin extends DiagramPlugin {
    get id() { return 'component'; }
    get name() { return 'Component Diagram'; }
    get icon() { return 'component-icon'; }
    get color() { return '#78716C'; }

    getShapeTools() {
        return [
            new ToolDefinition({ id: 'component', name: 'Component', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="4" width="14" height="16"/><rect x="2" y="8" width="6" height="4"/><rect x="2" y="14" width="6" height="4"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'interface', name: 'Interface', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="20"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'port', name: 'Port', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="8" height="8"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'provided', name: 'Provided', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M 12 6 A 6 6 0 0 1 12 18"/><line x1="4" y1="12" x2="12" y2="12"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'required', name: 'Required', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="12" r="4"/><line x1="4" y1="12" x2="12" y2="12"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'artifact', name: 'Artifact', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M 4 2 L 16 2 L 20 6 L 20 22 L 4 22 Z"/><path d="M 16 2 L 16 6 L 20 6"/></svg>`, type: 'shape' })
        ];
    }

    getConnectorTools() {
        return [
            new ToolDefinition({ id: 'compDependency', name: 'Dependency', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="4 2"/><polyline points="18,12 14,8"/><polyline points="18,12 14,16"/></svg>`, type: 'connector' }),
            new ToolDefinition({ id: 'compAssembly', name: 'Assembly', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="10" y2="12"/><circle cx="14" cy="12" r="4"/><path d="M 18 8 A 4 4 0 0 1 18 16"/></svg>`, type: 'connector' })
        ];
    }

    getShapeDefinitions() {
        return {
            'component': new ShapeDefinition({ type: 'component', name: 'Component', defaultWidth: 140, defaultHeight: 80 }),
            'interface': new ShapeDefinition({ type: 'interface', name: 'Interface', defaultWidth: 60, defaultHeight: 40 }),
            'port': new ShapeDefinition({ type: 'port', name: 'Port', defaultWidth: 16, defaultHeight: 16 }),
            'provided': new ShapeDefinition({ type: 'provided', name: 'Provided', defaultWidth: 30, defaultHeight: 30 }),
            'required': new ShapeDefinition({ type: 'required', name: 'Required', defaultWidth: 30, defaultHeight: 30 }),
            'artifact': new ShapeDefinition({ type: 'artifact', name: 'Artifact', defaultWidth: 100, defaultHeight: 70 })
        };
    }

    getConnectorTypes() {
        return [
            new ConnectorDefinition({ type: 'compDependency', name: 'Dependency', lineStyle: 'dashed', targetArrow: 'open' }),
            new ConnectorDefinition({ type: 'compAssembly', name: 'Assembly', lineStyle: 'solid', targetArrow: 'none' })
        ];
    }

    onActivate() { console.log('Component Diagram plugin activated'); }
    onDeactivate() { console.log('Component Diagram plugin deactivated'); }
}

// Register shapes
ShapeFactory.register('component', ComponentShape, { width: 140, height: 80 });
ShapeFactory.register('interface', InterfaceLollipop, { width: 60, height: 40 });
ShapeFactory.register('port', PortShape, { width: 16, height: 16 });
ShapeFactory.register('provided', ProvidedInterface, { width: 30, height: 30 });
ShapeFactory.register('required', RequiredInterface, { width: 30, height: 30 });
ShapeFactory.register('artifact', ArtifactShape, { width: 100, height: 70 });
