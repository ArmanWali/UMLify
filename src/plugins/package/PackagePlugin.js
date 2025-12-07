/**
 * Package Diagram Plugin
 * UML Package Diagram elements
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Package Shape
 */
export class PackageShape extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'package', width: 180, height: 120 });
        this.properties.name = options.name || 'Package';
        this.properties.stereotype = options.stereotype || '';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-package');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const tabWidth = 70;
        const tabHeight = 20;

        // Tab
        const tab = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tab.setAttribute('class', 'package-tab');
        tab.setAttribute('x', 0);
        tab.setAttribute('y', 0);
        tab.setAttribute('width', tabWidth);
        tab.setAttribute('height', tabHeight);
        tab.setAttribute('fill', this.style.fill);
        tab.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(tab);

        // Body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('class', 'package-body');
        body.setAttribute('x', 0);
        body.setAttribute('y', tabHeight);
        body.setAttribute('width', this.width);
        body.setAttribute('height', this.height - tabHeight);
        body.setAttribute('fill', this.style.fill);
        body.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(body);

        // Stereotype
        let nameY = tabHeight + 25;
        if (this.properties.stereotype) {
            const stereotype = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            stereotype.setAttribute('class', 'package-stereotype');
            stereotype.setAttribute('x', this.width / 2);
            stereotype.setAttribute('y', tabHeight + 20);
            stereotype.setAttribute('text-anchor', 'middle');
            stereotype.setAttribute('font-size', '11');
            stereotype.setAttribute('fill', '#666');
            stereotype.textContent = `«${this.properties.stereotype}»`;
            this.element.appendChild(stereotype);
            nameY = tabHeight + 38;
        }

        // Name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'package-name');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', nameY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-weight', 'bold');
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
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const tabHeight = 20;

        const body = this.element.querySelector('.package-body');
        if (body) {
            body.setAttribute('width', this.width);
            body.setAttribute('height', this.height - tabHeight);
            body.setAttribute('fill', this.style.fill);
            body.setAttribute('stroke', this.style.stroke);
        }

        const stereotype = this.element.querySelector('.package-stereotype');
        if (stereotype) {
            stereotype.setAttribute('x', this.width / 2);
        }

        const name = this.element.querySelector('.package-name');
        if (name) {
            name.setAttribute('x', this.width / 2);
            name.textContent = this.properties.name;
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
 * Subsystem Shape
 */
export class SubsystemShape extends PackageShape {
    constructor(options = {}) {
        super({ ...options, stereotype: 'subsystem' });
        this.type = 'subsystem';
    }
}

/**
 * Model Shape
 */
export class ModelShape extends PackageShape {
    constructor(options = {}) {
        super({ ...options, stereotype: 'model' });
        this.type = 'model';
        this.properties.name = options.name || 'Model';
    }
}

/**
 * Profile Shape
 */
export class ProfileShape extends PackageShape {
    constructor(options = {}) {
        super({ ...options, stereotype: 'profile' });
        this.type = 'profile';
        this.properties.name = options.name || 'Profile';
    }
}

/**
 * Namespace Shape (simplified package)
 */
export class NamespaceShape extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'namespace', width: 150, height: 80 });
        this.properties.name = options.name || 'Namespace';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-namespace');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Simple folder icon style
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('fill', this.style.fill);
        rect.setAttribute('stroke', this.style.stroke);
        rect.setAttribute('stroke-dasharray', '5 3');
        this.element.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2 + 5);
        text.setAttribute('text-anchor', 'middle');
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
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const rect = this.element.querySelector('rect');
        if (rect) {
            rect.setAttribute('width', this.width);
            rect.setAttribute('height', this.height);
            rect.setAttribute('fill', this.style.fill);
            rect.setAttribute('stroke', this.style.stroke);
        }

        const text = this.element.querySelector('text');
        if (text) {
            text.setAttribute('x', this.width / 2);
            text.setAttribute('y', this.height / 2 + 5);
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
 * Package Diagram Plugin
 */
export class PackagePlugin extends DiagramPlugin {
    get id() { return 'package'; }
    get name() { return 'Package Diagram'; }
    get icon() { return 'package-icon'; }
    get color() { return '#64748B'; }

    getShapeTools() {
        return [
            new ToolDefinition({ id: 'package', name: 'Package', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="14"/><rect x="3" y="3" width="10" height="4"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'subsystem', name: 'Subsystem', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="14"/><rect x="3" y="3" width="10" height="4"/><text x="12" y="16" font-size="6" text-anchor="middle">«ss»</text></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'model', name: 'Model', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="14"/><rect x="3" y="3" width="10" height="4"/><path d="M 8 12 L 12 16 L 16 12"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'profile', name: 'Profile', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="14"/><rect x="3" y="3" width="10" height="4"/><circle cx="12" cy="14" r="3"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'namespace', name: 'Namespace', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"><rect x="3" y="5" width="18" height="14"/></svg>`, type: 'shape' })
        ];
    }

    getConnectorTools() {
        return [
            new ToolDefinition({ id: 'pkgImport', name: 'Import', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="4 2"/><polyline points="18,12 14,8"/><polyline points="18,12 14,16"/></svg>`, type: 'connector' }),
            new ToolDefinition({ id: 'pkgAccess', name: 'Access', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="4 2"/><polyline points="18,12 14,8"/><polyline points="18,12 14,16"/></svg>`, type: 'connector' }),
            new ToolDefinition({ id: 'pkgMerge', name: 'Merge', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="4 2"/><polyline points="18,12 14,8"/><polyline points="18,12 14,16"/></svg>`, type: 'connector' }),
            new ToolDefinition({ id: 'pkgContainment', name: 'Containment', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="21" x2="12" y2="8"/><circle cx="12" cy="5" r="3" fill="currentColor"/></svg>`, type: 'connector' })
        ];
    }

    getShapeDefinitions() {
        return {
            'package': new ShapeDefinition({ type: 'package', name: 'Package', defaultWidth: 180, defaultHeight: 120 }),
            'subsystem': new ShapeDefinition({ type: 'subsystem', name: 'Subsystem', defaultWidth: 180, defaultHeight: 120 }),
            'model': new ShapeDefinition({ type: 'model', name: 'Model', defaultWidth: 180, defaultHeight: 120 }),
            'profile': new ShapeDefinition({ type: 'profile', name: 'Profile', defaultWidth: 180, defaultHeight: 120 }),
            'namespace': new ShapeDefinition({ type: 'namespace', name: 'Namespace', defaultWidth: 150, defaultHeight: 80 })
        };
    }

    getConnectorTypes() {
        return [
            new ConnectorDefinition({ type: 'pkgImport', name: 'Import', lineStyle: 'dashed', targetArrow: 'open' }),
            new ConnectorDefinition({ type: 'pkgAccess', name: 'Access', lineStyle: 'dashed', targetArrow: 'open' }),
            new ConnectorDefinition({ type: 'pkgMerge', name: 'Merge', lineStyle: 'dashed', targetArrow: 'open' }),
            new ConnectorDefinition({ type: 'pkgContainment', name: 'Containment', lineStyle: 'solid', sourceArrow: 'circle-filled' })
        ];
    }

    getPropertyEditors(element) {
        return [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'stereotype', label: 'Stereotype', type: 'text' }
        ];
    }

    onActivate() { console.log('Package Diagram plugin activated'); }
    onDeactivate() { console.log('Package Diagram plugin deactivated'); }
}

// Register shapes
ShapeFactory.register('package', PackageShape, { width: 180, height: 120 });
ShapeFactory.register('subsystem', SubsystemShape, { width: 180, height: 120 });
ShapeFactory.register('model', ModelShape, { width: 180, height: 120 });
ShapeFactory.register('profile', ProfileShape, { width: 180, height: 120 });
ShapeFactory.register('namespace', NamespaceShape, { width: 150, height: 80 });
