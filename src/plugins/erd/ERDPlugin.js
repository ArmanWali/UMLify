/**
 * ERD (Entity-Relationship Diagram) Plugin
 * Complete ERD elements for database modeling
 */

import { DiagramPlugin, ToolDefinition, ShapeDefinition, ConnectorDefinition } from '../../core/PluginRegistry.js';
import { Shape } from '../../shapes/Shape.js';
import { ShapeFactory } from '../../shapes/ShapeFactory.js';

/**
 * Entity Shape
 */
export class EntityShape extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'entity', width: 150, height: 120 });
        this.properties.name = options.name || 'Entity';
        this.properties.attributes = options.attributes || [
            { name: 'id', isPK: true, type: 'INT' },
            { name: 'name', isPK: false, type: 'VARCHAR' }
        ];
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-entity');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const headerHeight = 35;
        const attrHeight = Math.max(this.height - headerHeight, this.properties.attributes.length * 20 + 10);
        this.height = headerHeight + attrHeight;

        // Main body
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'entity-body');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('fill', this.style.fill);
        rect.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(rect);

        // Header
        const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        header.setAttribute('class', 'entity-header');
        header.setAttribute('width', this.width);
        header.setAttribute('height', headerHeight);
        header.setAttribute('fill', '#E0E7FF');
        header.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(header);

        // Entity name
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('class', 'entity-name');
        nameText.setAttribute('x', this.width / 2);
        nameText.setAttribute('y', 22);
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('font-weight', 'bold');
        nameText.textContent = this.properties.name;
        this.element.appendChild(nameText);

        // Attributes
        let y = headerHeight + 18;
        this.properties.attributes.forEach(attr => {
            const attrText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            attrText.setAttribute('x', 10);
            attrText.setAttribute('y', y);
            attrText.setAttribute('font-size', '12');

            let label = attr.isPK ? '🔑 ' : '    ';
            label += `${attr.name}: ${attr.type}`;
            attrText.textContent = label;

            if (attr.isPK) {
                attrText.setAttribute('text-decoration', 'underline');
            }

            this.element.appendChild(attrText);
            y += 20;
        });

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

        const body = this.element.querySelector('.entity-body');
        if (body) {
            body.setAttribute('width', this.width);
            body.setAttribute('height', this.height);
            body.setAttribute('fill', this.style.fill);
            body.setAttribute('stroke', this.style.stroke);
        }

        const header = this.element.querySelector('.entity-header');
        if (header) {
            header.setAttribute('width', this.width);
            header.setAttribute('stroke', this.style.stroke);
        }

        const nameText = this.element.querySelector('.entity-name');
        if (nameText) {
            nameText.setAttribute('x', this.width / 2);
            nameText.textContent = this.properties.name;
        }

        // Weak entity outer rect
        const outer = this.element.querySelector('.weak-outer');
        if (outer) {
            outer.setAttribute('width', this.width + 6);
            outer.setAttribute('height', this.height + 6);
            outer.setAttribute('stroke', this.style.stroke);
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
 * Weak Entity Shape (double border)
 */
export class WeakEntity extends EntityShape {
    constructor(options = {}) {
        super(options);
        this.type = 'weakEntity';
    }

    render(container) {
        super.render(container);

        // Add outer rectangle for weak entity
        const outer = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        outer.setAttribute('class', 'weak-outer');
        outer.setAttribute('x', -3);
        outer.setAttribute('y', -3);
        outer.setAttribute('width', this.width + 6);
        outer.setAttribute('height', this.height + 6);
        outer.setAttribute('fill', 'none');
        outer.setAttribute('stroke', this.style.stroke);
        this.element.insertBefore(outer, this.element.firstChild);

        return this.element;
    }
}

/**
 * Attribute Shape (ellipse)
 */
export class AttributeShape extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'attribute', width: 100, height: 40 });
        this.properties.name = options.name || 'attribute';
        this.properties.isKey = options.isKey || false;
        this.properties.isMultivalued = options.isMultivalued || false;
        this.properties.isDerived = options.isDerived || false;
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-attribute');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', this.width / 2);
        ellipse.setAttribute('cy', this.height / 2);
        ellipse.setAttribute('rx', this.width / 2 - 2);
        ellipse.setAttribute('ry', this.height / 2 - 2);
        ellipse.setAttribute('fill', this.style.fill);
        ellipse.setAttribute('stroke', this.style.stroke);

        if (this.properties.isDerived) {
            ellipse.setAttribute('stroke-dasharray', '5 3');
        }
        this.element.appendChild(ellipse);

        // Multivalued (double ellipse)
        if (this.properties.isMultivalued) {
            const inner = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            inner.setAttribute('cx', this.width / 2);
            inner.setAttribute('cy', this.height / 2);
            inner.setAttribute('rx', this.width / 2 - 6);
            inner.setAttribute('ry', this.height / 2 - 6);
            inner.setAttribute('fill', 'none');
            inner.setAttribute('stroke', this.style.stroke);
            this.element.appendChild(inner);
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2 + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        if (this.properties.isKey) {
            text.setAttribute('text-decoration', 'underline');
        }
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
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const ellipses = this.element.querySelectorAll('ellipse');
        ellipses.forEach((ellipse, index) => {
            ellipse.setAttribute('cx', this.width / 2);
            ellipse.setAttribute('cy', this.height / 2);
            if (index === 0) { // Outer
                ellipse.setAttribute('rx', this.width / 2 - 2);
                ellipse.setAttribute('ry', this.height / 2 - 2);
            } else { // Inner (multivalued)
                ellipse.setAttribute('rx', this.width / 2 - 6);
                ellipse.setAttribute('ry', this.height / 2 - 6);
            }
        });

        const text = this.element.querySelector('text');
        if (text) {
            text.setAttribute('x', this.width / 2);
            text.setAttribute('y', this.height / 2 + 4);
            text.textContent = this.properties.name;
        }
    }
}

/**
 * Relationship Shape (diamond)
 */
export class RelationshipShape extends Shape {
    constructor(options = {}) {
        super({ ...options, type: 'relationship', width: 80, height: 60 });
        this.properties.name = options.name || 'relates';
    }

    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'shape shape-relationship');
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        const cx = this.width / 2;
        const cy = this.height / 2;
        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        diamond.setAttribute('points', `${cx},2 ${this.width - 2},${cy} ${cx},${this.height - 2} 2,${cy}`);
        diamond.setAttribute('fill', '#FEF3C7');
        diamond.setAttribute('stroke', this.style.stroke);
        this.element.appendChild(diamond);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
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

        const diamond = this.element.querySelector('polygon');
        if (diamond) {
            const cx = this.width / 2;
            const cy = this.height / 2;
            diamond.setAttribute('points', `${cx},2 ${this.width - 2},${cy} ${cx},${this.height - 2} 2,${cy}`);
            diamond.setAttribute('fill', '#FEF3C7');
            diamond.setAttribute('stroke', this.style.stroke);
        }

        const text = this.element.querySelector('text');
        if (text) {
            text.setAttribute('x', this.width / 2);
            text.setAttribute('y', this.height / 2 + 4);
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
 * ERD Plugin
 */
export class ERDPlugin extends DiagramPlugin {
    get id() { return 'erd'; }
    get name() { return 'ERD'; }
    get icon() { return 'erd-icon'; }
    get color() { return '#06B6D4'; }

    getShapeTools() {
        return [
            new ToolDefinition({ id: 'entity', name: 'Entity', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18"/><line x1="3" y1="9" x2="21" y2="9"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'weakEntity', name: 'Weak Entity', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20"/><rect x="4" y="4" width="16" height="16"/><line x1="4" y1="10" x2="20" y2="10"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'attribute', name: 'Attribute', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9" ry="6"/></svg>`, type: 'shape' }),
            new ToolDefinition({ id: 'relationship', name: 'Relationship', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,12 12,22 2,12"/></svg>`, type: 'shape' })
        ];
    }

    getConnectorTools() {
        return [
            new ToolDefinition({ id: 'erdLink', name: 'Link', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>`, type: 'connector' }),
            new ToolDefinition({ id: 'erdOneToMany', name: 'One to Many', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="18" y2="12"/><line x1="3" y1="8" x2="3" y2="16"/><line x1="18" y1="8" x2="21" y2="12"/><line x1="18" y1="16" x2="21" y2="12"/></svg>`, type: 'connector' }),
            new ToolDefinition({ id: 'erdManyToMany', name: 'Many to Many', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="18" y2="12"/><line x1="3" y1="8" x2="6" y2="12"/><line x1="3" y1="16" x2="6" y2="12"/><line x1="18" y1="8" x2="21" y2="12"/><line x1="18" y1="16" x2="21" y2="12"/></svg>`, type: 'connector' })
        ];
    }

    getShapeDefinitions() {
        return {
            'entity': new ShapeDefinition({ type: 'entity', name: 'Entity', defaultWidth: 150, defaultHeight: 120 }),
            'weakEntity': new ShapeDefinition({ type: 'weakEntity', name: 'Weak Entity', defaultWidth: 150, defaultHeight: 120 }),
            'attribute': new ShapeDefinition({ type: 'attribute', name: 'Attribute', defaultWidth: 100, defaultHeight: 40 }),
            'relationship': new ShapeDefinition({ type: 'relationship', name: 'Relationship', defaultWidth: 80, defaultHeight: 60 })
        };
    }

    getConnectorTypes() {
        return [
            new ConnectorDefinition({ type: 'erdLink', name: 'Link', lineStyle: 'solid', targetArrow: 'none' }),
            new ConnectorDefinition({ type: 'erdOneToMany', name: 'One to Many', lineStyle: 'solid', targetArrow: 'crowfoot' }),
            new ConnectorDefinition({ type: 'erdManyToMany', name: 'Many to Many', lineStyle: 'solid', sourceArrow: 'crowfoot', targetArrow: 'crowfoot' })
        ];
    }

    getPropertyEditors(element) {
        if (element.type === 'entity' || element.type === 'weakEntity') {
            return [
                { key: 'name', label: 'Entity Name', type: 'text' },
                { key: 'attributes', label: 'Attributes', type: 'list' }
            ];
        }
        if (element.type === 'attribute') {
            return [
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'isKey', label: 'Primary Key', type: 'checkbox' },
                { key: 'isMultivalued', label: 'Multivalued', type: 'checkbox' },
                { key: 'isDerived', label: 'Derived', type: 'checkbox' }
            ];
        }
        return [];
    }

    onActivate() { console.log('ERD plugin activated'); }
    onDeactivate() { console.log('ERD plugin deactivated'); }
}

// Register shapes
ShapeFactory.register('entity', EntityShape, { width: 150, height: 120 });
ShapeFactory.register('weakEntity', WeakEntity, { width: 150, height: 120 });
ShapeFactory.register('attribute', AttributeShape, { width: 100, height: 40 });
ShapeFactory.register('relationship', RelationshipShape, { width: 80, height: 60 });
