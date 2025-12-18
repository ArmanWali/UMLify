/**
 * Shape - Base class for all diagram shapes
 * Implements core shape behavior with decorator-ready structure
 */

import { Rectangle, Point, generateId } from '../utils/geometry.js';
import { EventBus, Events } from '../core/EventBus.js';

export class Shape {
    constructor(options = {}) {
        this.id = options.id || generateId('shape');
        this.type = options.type || 'rectangle';
        this.diagramType = options.diagramType || 'generic';

        // Position and size
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 120;
        this.height = options.height || 60;

        // Properties
        this.properties = {
            name: options.name || '',
            stereotype: options.stereotype || '',
            ...options.properties
        };

        // Style
        this.style = {
            fill: '#FFFFFF',
            stroke: '#333333',
            strokeWidth: 1.5,
            ...options.style
        };

        // State
        this.selected = false;
        this.hovered = false;
        this.editing = false;

        // Constraints
        this.minWidth = options.minWidth || 40;
        this.minHeight = options.minHeight || 30;
        this.resizable = options.resizable !== false;

        // DOM element reference
        this.element = null;

        this.eventBus = EventBus.getInstance();
    }

    /**
     * Get the bounding rectangle
     * @returns {Rectangle}
     */
    getBounds() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    /**
     * Set position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateElement();
        this.eventBus.emit(Events.SHAPE_UPDATED, { shape: this, property: 'position' });
    }

    /**
     * Set size
     * @param {number} width - Width
     * @param {number} height - Height
     */
    setSize(width, height) {
        this.width = Math.max(width, this.minWidth);
        this.height = Math.max(height, this.minHeight);
        this.updateElement();
        this.eventBus.emit(Events.SHAPE_UPDATED, { shape: this, property: 'size' });
    }

    /**
     * Set bounds (position and size) in one operation
     * This avoids multiple events when resizing
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     */
    setBounds(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = Math.max(width, this.minWidth);
        this.height = Math.max(height, this.minHeight);
        this.updateElement();
        this.eventBus.emit(Events.SHAPE_UPDATED, { shape: this, property: 'bounds' });
    }

    /**
     * Move by delta
     * @param {number} dx - Delta X
     * @param {number} dy - Delta Y
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.updateElement();
        // Note: Don't emit here to avoid too many events during drag
    }

    /**
     * Check if point is inside shape
     * @param {Point} point - Point to check
     * @returns {boolean}
     */
    containsPoint(point) {
        return this.getBounds().contains(point);
    }

    /**
     * Get connection points
     * @returns {Object} Map of connection point positions
     */
    getConnectionPoints() {
        const bounds = this.getBounds();
        return {
            top: bounds.getConnectionPoint('top'),
            right: bounds.getConnectionPoint('right'),
            bottom: bounds.getConnectionPoint('bottom'),
            left: bounds.getConnectionPoint('left'),
            center: bounds.center
        };
    }

    /**
     * Get nearest connection point to a position
     * @param {Point} point - Reference point
     * @returns {Object} { side, point }
     */
    getNearestConnectionPoint(point) {
        return this.getBounds().getNearestConnectionPoint(point);
    }

    /**
     * Set selection state
     * @param {boolean} selected - Selection state
     */
    setSelected(selected) {
        this.selected = selected;
        if (this.element) {
            this.element.classList.toggle('shape--selected', selected);
        }
    }

    /**
     * Set hover state
     * @param {boolean} hovered - Hover state
     */
    setHovered(hovered) {
        this.hovered = hovered;
        if (this.element) {
            this.element.classList.toggle('shape--hovered', hovered);
        }
    }

    /**
     * Update a property
     * @param {string} key - Property key
     * @param {*} value - Property value
     */
    setProperty(key, value) {
        this.properties[key] = value;
        this.updateElement();
        this.eventBus.emit(Events.SHAPE_UPDATED, { shape: this, property: key, value });
    }

    /**
     * Update style
     * @param {Object} style - Style properties to update
     */
    setStyle(style) {
        Object.assign(this.style, style);
        this.updateElement();
    }

    /**
     * Render the shape to SVG
     * @param {SVGElement} container - Parent SVG container
     * @returns {SVGElement} The shape element
     */
    render(container) {
        // Create group element
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', `shape shape-${this.type}`);
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Create body (rectangle by default)
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('class', 'shape__body');
        body.setAttribute('width', this.width);
        body.setAttribute('height', this.height);
        body.setAttribute('fill', this.style.fill);
        body.setAttribute('stroke', this.style.stroke);
        body.setAttribute('stroke-width', this.style.strokeWidth);
        body.setAttribute('rx', '6');
        body.setAttribute('ry', '6');
        this.element.appendChild(body);

        // Create text element
        if (this.properties.name) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'shape__text shape__text--name');
            text.setAttribute('x', this.width / 2);
            text.setAttribute('y', this.height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.textContent = this.properties.name;
            this.element.appendChild(text);
        }

        // Add connection points
        this.renderConnectionPoints(this.element);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Render connection points
     * @param {SVGElement} container - Parent element
     */
    renderConnectionPoints(container) {
        const points = [
            { side: 'top', x: this.width / 2, y: 0 },
            { side: 'right', x: this.width, y: this.height / 2 },
            { side: 'bottom', x: this.width / 2, y: this.height },
            { side: 'left', x: 0, y: this.height / 2 }
        ];

        points.forEach(p => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', `connection-point connection-point--${p.side}`);
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', '5');
            circle.setAttribute('data-side', p.side);
            container.appendChild(circle);
        });
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

        // Update text
        const text = this.element.querySelector('.shape__text--name');
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

    /**
     * Remove the shape from DOM
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            diagramType: this.diagramType,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            properties: { ...this.properties },
            style: { ...this.style }
        };
    }

    /**
     * Create shape from JSON
     * @param {Object} data - JSON data
     * @returns {Shape}
     */
    static fromJSON(data) {
        return new Shape(data);
    }
}
