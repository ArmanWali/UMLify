/**
 * Class Diagram Plugin
 * Implements Strategy pattern for class diagram specific behavior
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { Connection } from '../../shapes/Connection.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Class Shape for Class Diagrams
 */
export class ClassShape extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'class',
            width: options.width || 150,
            height: options.height || 120
        });
        this.properties.name = options.name || 'ClassName';
        this.properties.stereotype = options.stereotype || '';
        this.properties.attributes = options.attributes || [];
        this.properties.methods = options.methods || [];
        this.properties.isAbstract = options.isAbstract || false;
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', `shape shape-class ${this.properties.isAbstract ? 'shape-abstract' : ''}`);
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Calculate compartment heights
        const nameHeight = 40;
        const attrHeight = Math.max(30, this.properties.attributes.length * 18 + 10);
        const methodHeight = Math.max(30, this.properties.methods.length * 18 + 10);
        this.height = nameHeight + attrHeight + methodHeight;

        // Main rectangle
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('class', 'shape__body');
        body.setAttribute('width', this.width);
        body.setAttribute('height', this.height);
        body.setAttribute('fill', this.style.fill);
        body.setAttribute('stroke', this.style.stroke);
        body.setAttribute('stroke-width', this.style.strokeWidth);
        this.element.appendChild(body);

        // Divider after name
        const divider1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        divider1.setAttribute('class', 'shape-class__divider');
        divider1.setAttribute('x1', 0);
        divider1.setAttribute('y1', nameHeight);
        divider1.setAttribute('x2', this.width);
        divider1.setAttribute('y2', nameHeight);
        divider1.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(divider1);

        // Divider after attributes
        const divider2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        divider2.setAttribute('class', 'shape-class__divider');
        divider2.setAttribute('x1', 0);
        divider2.setAttribute('y1', nameHeight + attrHeight);
        divider2.setAttribute('x2', this.width);
        divider2.setAttribute('y2', nameHeight + attrHeight);
        divider2.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(divider2);

        // Stereotype
        if (this.properties.stereotype) {
            const stereotype = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            stereotype.setAttribute('class', 'shape__text shape__text--stereotype');
            stereotype.setAttribute('x', this.width / 2);
            stereotype.setAttribute('y', 12);
            stereotype.setAttribute('text-anchor', 'middle');
            stereotype.textContent = `«${this.properties.stereotype}»`;
            this.element.appendChild(stereotype);
        }

        // Class name
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('class', 'shape__text shape-class__name');
        nameText.setAttribute('x', this.width / 2);
        nameText.setAttribute('y', this.properties.stereotype ? 28 : 24);
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('font-weight', 'bold');
        if (this.properties.isAbstract) {
            nameText.setAttribute('font-style', 'italic');
        }
        nameText.textContent = this.properties.name;
        this.element.appendChild(nameText);

        // Attributes
        let attrY = nameHeight + 16;
        this.properties.attributes.forEach(attr => {
            const attrText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            attrText.setAttribute('class', 'shape__text shape-class__attribute');
            attrText.setAttribute('x', 8);
            attrText.setAttribute('y', attrY);
            attrText.textContent = attr;
            this.element.appendChild(attrText);
            attrY += 18;
        });

        // Methods
        let methodY = nameHeight + attrHeight + 16;
        this.properties.methods.forEach(method => {
            const methodText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            methodText.setAttribute('class', 'shape__text shape-class__method');
            methodText.setAttribute('x', 8);
            methodText.setAttribute('y', methodY);
            methodText.textContent = method;
            this.element.appendChild(methodText);
            methodY += 18;
        });

        // Connection points
        this.renderConnectionPoints(this.element);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Interface Shape
 */
export class InterfaceShape extends ClassShape {
    constructor(options = {}) {
        super({
            ...options,
            stereotype: 'interface'
        });
        this.type = 'interface';
    }
}

/**
 * Package Shape
 */
export class PackageShape extends Shape {
    constructor(options = {}) {
        super({
            ...options,
            type: 'package',
            width: options.width || 200,
            height: options.height || 150
        });
        this.properties.name = options.name || 'Package';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-package');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const tabWidth = 60;
        const tabHeight = 20;

        // Package tab
        const tab = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tab.setAttribute('class', 'shape-package__tab');
        tab.setAttribute('x', 0);
        tab.setAttribute('y', 0);
        tab.setAttribute('width', tabWidth);
        tab.setAttribute('height', tabHeight);
        tab.setAttribute('fill', this.style.fill);
        tab.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(tab);

        // Package body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('class', 'shape__body');
        body.setAttribute('x', 0);
        body.setAttribute('y', tabHeight);
        body.setAttribute('width', this.width);
        body.setAttribute('height', this.height - tabHeight);
        body.setAttribute('fill', this.style.fill);
        body.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(body);

        // Package name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'shape__text shape__text--name');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', tabHeight + 25);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-weight', 'bold');
        text.textContent = this.properties.name;
        this.element.appendChild(text);

        container.appendChild(this.element);
        return this.element;
    }
}

/**
 * Class Diagram Plugin
 */
export class ClassPlugin extends DiagramPlugin {
    constructor() {
        super();
    }

    get id() { return 'class'; }
    get name() { return 'Class Diagram'; }
    get icon() { return 'class-icon'; }
    get color() { return '#3B82F6'; }

    getShapeTools() {
        return [
            new ToolDefinition({
                id: 'class',
                name: 'Class',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="3" y1="15" x2="21" y2="15"/>
                </svg>`,
                type: 'shape',
                shortcut: 'C'
            }),
            new ToolDefinition({
                id: 'interface',
                name: 'Interface',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" stroke-dasharray="4 2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="3" y1="15" x2="21" y2="15"/>
                </svg>`,
                type: 'shape',
                shortcut: 'I'
            }),
            new ToolDefinition({
                id: 'package',
                name: 'Package',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="7" width="18" height="14"/>
                    <rect x="3" y="3" width="8" height="4"/>
                </svg>`,
                type: 'shape',
                shortcut: 'P'
            })
        ];
    }

    getConnectorTools() {
        return [
            new ToolDefinition({
                id: 'inheritance',
                name: 'Inheritance',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="21" x2="12" y2="8"/>
                    <polygon points="12,3 8,8 16,8" fill="none" stroke="currentColor"/>
                </svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'association',
                name: 'Association',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                </svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'aggregation',
                name: 'Aggregation',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="10" y1="12" x2="21" y2="12"/>
                    <polygon points="3,12 6,9 10,12 6,15" fill="none"/>
                </svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'composition',
                name: 'Composition',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="10" y1="12" x2="21" y2="12"/>
                    <polygon points="3,12 6,9 10,12 6,15" fill="currentColor"/>
                </svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'dependency',
                name: 'Dependency',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="4 2"/>
                    <polyline points="18,12 14,8"/>
                    <polyline points="18,12 14,16"/>
                </svg>`,
                type: 'connector'
            }),
            new ToolDefinition({
                id: 'realization',
                name: 'Realization',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="21" x2="12" y2="8" stroke-dasharray="4 2"/>
                    <polygon points="12,3 8,8 16,8" fill="none"/>
                </svg>`,
                type: 'connector'
            })
        ];
    }

    getConnectorTypes() {
        return [
            new ConnectorDefinition({
                type: 'inheritance',
                name: 'Inheritance',
                lineStyle: 'solid',
                targetArrow: 'triangle'
            }),
            new ConnectorDefinition({
                type: 'association',
                name: 'Association',
                lineStyle: 'solid',
                targetArrow: 'none'
            }),
            new ConnectorDefinition({
                type: 'aggregation',
                name: 'Aggregation',
                lineStyle: 'solid',
                sourceArrow: 'diamond'
            }),
            new ConnectorDefinition({
                type: 'composition',
                name: 'Composition',
                lineStyle: 'solid',
                sourceArrow: 'diamond-filled'
            }),
            new ConnectorDefinition({
                type: 'dependency',
                name: 'Dependency',
                lineStyle: 'dashed',
                targetArrow: 'open'
            }),
            new ConnectorDefinition({
                type: 'realization',
                name: 'Realization',
                lineStyle: 'dashed',
                targetArrow: 'triangle'
            })
        ];
    }

    getPropertyEditors(element) {
        if (element.type === 'class' || element.type === 'interface') {
            return [
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'stereotype', label: 'Stereotype', type: 'text' },
                { key: 'isAbstract', label: 'Abstract', type: 'checkbox' },
                { key: 'attributes', label: 'Attributes', type: 'list' },
                { key: 'methods', label: 'Methods', type: 'list' }
            ];
        }
        if (element.type === 'package') {
            return [
                { key: 'name', label: 'Package Name', type: 'text' }
            ];
        }
        return [];
    }

    onActivate() {
        console.log('Class Diagram plugin activated');
    }

    onDeactivate() {
        console.log('Class Diagram plugin deactivated');
    }
}

// Register shapes
ShapeFactory.register('class', ClassShape, { width: 150, height: 120 });
ShapeFactory.register('interface', InterfaceShape, { width: 150, height: 120 });
ShapeFactory.register('package', PackageShape, { width: 200, height: 150 });
