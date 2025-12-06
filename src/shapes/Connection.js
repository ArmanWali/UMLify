/**
 * Connection - Base class for all diagram connections/arrows
 */

import { Point, generateId, angleBetween, toDegrees } from '../utils/geometry.js';
import { EventBus, Events } from '../core/EventBus.js';

export class Connection {
    constructor(options = {}) {
        this.id = options.id || generateId('conn');
        this.type = options.type || 'association';
        this.diagramType = options.diagramType || 'generic';

        // Source and target
        this.source = {
            shapeId: options.sourceId || null,
            anchor: options.sourceAnchor || 'auto'
        };
        this.target = {
            shapeId: options.targetId || null,
            anchor: options.targetAnchor || 'auto'
        };

        // Waypoints for custom routing
        this.waypoints = options.waypoints || [];

        // Properties
        this.properties = {
            label: options.label || '',
            ...options.properties
        };

        // Style
        this.style = {
            stroke: '#333333',
            strokeWidth: 1.5,
            lineStyle: 'solid', // 'solid', 'dashed', 'dotted'
            sourceArrow: 'none',
            targetArrow: 'filled', // 'none', 'filled', 'open', 'diamond', 'diamond-filled', 'triangle'
            ...options.style
        };

        // State
        this.selected = false;
        this.hovered = false;

        // DOM element reference
        this.element = null;

        // Shape references (set by diagram)
        this.sourceShape = null;
        this.targetShape = null;

        this.eventBus = EventBus.getInstance();
    }

    /**
     * Set source shape
     * @param {Shape} shape - Source shape
     * @param {string} anchor - Anchor point
     */
    setSource(shape, anchor = 'auto') {
        this.sourceShape = shape;
        this.source.shapeId = shape ? shape.id : null;
        this.source.anchor = anchor;
        this.updateElement();
    }

    /**
     * Set target shape
     * @param {Shape} shape - Target shape
     * @param {string} anchor - Anchor point
     */
    setTarget(shape, anchor = 'auto') {
        this.targetShape = shape;
        this.target.shapeId = shape ? shape.id : null;
        this.target.anchor = anchor;
        this.updateElement();
    }

    /**
     * Get the start point of the connection
     * @returns {Point}
     */
    getStartPoint() {
        if (!this.sourceShape) return new Point(0, 0);

        if (this.source.anchor === 'auto') {
            // Find nearest point to target
            const targetCenter = this.targetShape
                ? this.targetShape.getBounds().center
                : (this.waypoints.length > 0 ? this.waypoints[0] : new Point(0, 0));
            return this.sourceShape.getNearestConnectionPoint(targetCenter).point;
        }

        return this.sourceShape.getConnectionPoints()[this.source.anchor];
    }

    /**
     * Get the end point of the connection
     * @returns {Point}
     */
    getEndPoint() {
        if (!this.targetShape) return new Point(0, 0);

        if (this.target.anchor === 'auto') {
            // Find nearest point to source
            const sourceCenter = this.sourceShape
                ? this.sourceShape.getBounds().center
                : (this.waypoints.length > 0 ? this.waypoints[this.waypoints.length - 1] : new Point(0, 0));
            return this.targetShape.getNearestConnectionPoint(sourceCenter).point;
        }

        return this.targetShape.getConnectionPoints()[this.target.anchor];
    }

    /**
     * Get all points of the connection path
     * @returns {Point[]}
     */
    getPath() {
        const start = this.getStartPoint();
        const end = this.getEndPoint();
        return [start, ...this.waypoints, end];
    }

    /**
     * Set selection state
     * @param {boolean} selected - Selection state
     */
    setSelected(selected) {
        this.selected = selected;
        if (this.element) {
            this.element.classList.toggle('connector--selected', selected);

            // Show/hide endpoint handles and waypoint handles
            const endpoints = this.element.querySelectorAll('.connector__endpoint');
            const waypoints = this.element.querySelectorAll('.connector__waypoint');
            const addWaypoint = this.element.querySelector('.connector__add-waypoint');

            endpoints.forEach(ep => {
                ep.style.display = selected ? 'block' : 'none';
            });
            waypoints.forEach(wp => {
                wp.style.display = selected ? 'block' : 'none';
            });
            if (addWaypoint) {
                addWaypoint.style.display = selected ? 'block' : 'none';
            }
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
        this.eventBus.emit(Events.CONNECTION_UPDATED, { connection: this, property: key, value });
    }

    /**
     * Render the connection to SVG
     * @param {SVGElement} container - Parent SVG container
     * @returns {SVGElement} The connection element
     */
    render(container) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', `connector connector-${this.type}`);
        this.element.setAttribute('data-id', this.id);

        // Create the line path
        const path = this.getPath();
        const pathData = this.buildPathData(path);

        // Invisible hit area for easier clicking
        const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitArea.setAttribute('class', 'connector__hitarea');
        hitArea.setAttribute('d', pathData);
        hitArea.setAttribute('fill', 'none');
        hitArea.setAttribute('stroke', 'transparent');
        hitArea.setAttribute('stroke-width', '12');
        this.element.appendChild(hitArea);

        // Visible line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('class', 'connector__line');
        line.setAttribute('d', pathData);
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', this.style.stroke);
        line.setAttribute('stroke-width', this.style.strokeWidth);

        // Line style
        if (this.style.lineStyle === 'dashed') {
            line.setAttribute('stroke-dasharray', '8 4');
        } else if (this.style.lineStyle === 'dotted') {
            line.setAttribute('stroke-dasharray', '3 3');
        }

        // Arrow markers
        if (this.style.targetArrow !== 'none') {
            line.setAttribute('marker-end', `url(#arrow-${this.style.targetArrow})`);
        }
        if (this.style.sourceArrow !== 'none') {
            line.setAttribute('marker-start', `url(#arrow-${this.style.sourceArrow})`);
        }

        this.element.appendChild(line);

        // Add label if exists
        if (this.properties.label) {
            this.renderLabel(this.element, path);
        }

        // Add endpoint handles for manipulation (visible when selected)
        this.renderEndpointHandles(path);

        container.appendChild(this.element);
        return this.element;
    }

    /**
     * Render endpoint handles for dragging
     */
    renderEndpointHandles(path) {
        if (path.length < 2) return;

        const start = path[0];
        const end = path[path.length - 1];

        // Source endpoint handle
        const sourceHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        sourceHandle.setAttribute('class', 'connector__endpoint connector__endpoint--source');
        sourceHandle.setAttribute('cx', start.x);
        sourceHandle.setAttribute('cy', start.y);
        sourceHandle.setAttribute('r', '6');
        sourceHandle.setAttribute('fill', '#fff');
        sourceHandle.setAttribute('stroke', '#0066FF');
        sourceHandle.setAttribute('stroke-width', '2');
        sourceHandle.style.display = 'none';
        sourceHandle.style.cursor = 'move';
        this.element.appendChild(sourceHandle);

        // Target endpoint handle
        const targetHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        targetHandle.setAttribute('class', 'connector__endpoint connector__endpoint--target');
        targetHandle.setAttribute('cx', end.x);
        targetHandle.setAttribute('cy', end.y);
        targetHandle.setAttribute('r', '6');
        targetHandle.setAttribute('fill', '#fff');
        targetHandle.setAttribute('stroke', '#0066FF');
        targetHandle.setAttribute('stroke-width', '2');
        targetHandle.style.display = 'none';
        targetHandle.style.cursor = 'move';
        this.element.appendChild(targetHandle);

        // Render waypoint handles
        for (let i = 0; i < this.waypoints.length; i++) {
            const wp = this.waypoints[i];
            const wpHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            wpHandle.setAttribute('class', 'connector__waypoint');
            wpHandle.setAttribute('x', wp.x - 4);
            wpHandle.setAttribute('y', wp.y - 4);
            wpHandle.setAttribute('width', '8');
            wpHandle.setAttribute('height', '8');
            wpHandle.setAttribute('fill', '#0066FF');
            wpHandle.setAttribute('data-waypoint-index', i);
            wpHandle.style.display = 'none';
            wpHandle.style.cursor = 'move';
            this.element.appendChild(wpHandle);
        }

        // Middle segment handle for creating new waypoints
        if (path.length >= 2) {
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            const addWaypointHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            addWaypointHandle.setAttribute('class', 'connector__add-waypoint');
            addWaypointHandle.setAttribute('cx', midX);
            addWaypointHandle.setAttribute('cy', midY);
            addWaypointHandle.setAttribute('r', '5');
            addWaypointHandle.setAttribute('fill', '#10B981');
            addWaypointHandle.setAttribute('stroke', '#fff');
            addWaypointHandle.setAttribute('stroke-width', '1');
            addWaypointHandle.style.display = 'none';
            addWaypointHandle.style.cursor = 'crosshair';
            this.element.appendChild(addWaypointHandle);
        }
    }

    /**
     * Build SVG path data from points
     * @param {Point[]} points - Path points
     * @returns {string} SVG path data
     */
    buildPathData(points) {
        if (points.length < 2) return '';

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        return d;
    }

    /**
     * Render the label
     * @param {SVGElement} container - Parent element
     * @param {Point[]} path - Connection path
     */
    renderLabel(container, path) {
        if (path.length < 2) return;

        // Position label at midpoint
        const midIndex = Math.floor(path.length / 2);
        const p1 = path[midIndex - 1] || path[0];
        const p2 = path[midIndex] || path[1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Background for readability
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('class', 'connector__label-bg');
        bg.setAttribute('x', midX - 30);
        bg.setAttribute('y', midY - 10);
        bg.setAttribute('width', 60);
        bg.setAttribute('height', 20);
        bg.setAttribute('rx', '3');
        container.appendChild(bg);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'connector__label');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = this.properties.label;
        container.appendChild(text);
    }

    /**
     * Update element to match current state
     */
    updateElement() {
        if (!this.element) return;

        const path = this.getPath();
        const pathData = this.buildPathData(path);

        // Update hit area
        const hitArea = this.element.querySelector('.connector__hitarea');
        if (hitArea) {
            hitArea.setAttribute('d', pathData);
        }

        // Update visible line
        const line = this.element.querySelector('.connector__line');
        if (line) {
            line.setAttribute('d', pathData);
            line.setAttribute('stroke', this.style.stroke);
        }

        // Update endpoint handles
        if (path.length >= 2) {
            const sourceHandle = this.element.querySelector('.connector__endpoint--source');
            const targetHandle = this.element.querySelector('.connector__endpoint--target');

            if (sourceHandle) {
                sourceHandle.setAttribute('cx', path[0].x);
                sourceHandle.setAttribute('cy', path[0].y);
            }
            if (targetHandle) {
                targetHandle.setAttribute('cx', path[path.length - 1].x);
                targetHandle.setAttribute('cy', path[path.length - 1].y);
            }

            // Update add-waypoint handle
            const addWaypointHandle = this.element.querySelector('.connector__add-waypoint');
            if (addWaypointHandle) {
                const midX = (path[0].x + path[path.length - 1].x) / 2;
                const midY = (path[0].y + path[path.length - 1].y) / 2;
                addWaypointHandle.setAttribute('cx', midX);
                addWaypointHandle.setAttribute('cy', midY);
            }
        }
    }

    /**
     * Add a waypoint at the given position
     * @param {Point} point - Position for new waypoint
     * @param {number} index - Index to insert at (default: middle)
     */
    addWaypoint(point, index = -1) {
        if (index < 0 || index > this.waypoints.length) {
            index = this.waypoints.length;
        }
        this.waypoints.splice(index, 0, point);
        this.updateElement();
    }

    /**
     * Move a waypoint
     * @param {number} index - Waypoint index
     * @param {Point} point - New position
     */
    moveWaypoint(index, point) {
        if (index >= 0 && index < this.waypoints.length) {
            this.waypoints[index] = point;
            this.updateElement();
        }
    }

    /**
     * Remove a waypoint
     * @param {number} index - Waypoint index
     */
    removeWaypoint(index) {
        if (index >= 0 && index < this.waypoints.length) {
            this.waypoints.splice(index, 1);
            this.updateElement();
        }
    }

    /**
     * Remove the connection from DOM
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Check if a point is near the connection line
     * @param {Point} point - Point to check
     * @param {number} threshold - Distance threshold
     * @returns {boolean}
     */
    isPointNear(point, threshold = 10) {
        const path = this.getPath();
        for (let i = 0; i < path.length - 1; i++) {
            const dist = this.pointToLineDistance(point, path[i], path[i + 1]);
            if (dist <= threshold) return true;
        }
        return false;
    }

    /**
     * Calculate distance from point to line segment
     * @param {Point} point - Point
     * @param {Point} lineStart - Line start
     * @param {Point} lineEnd - Line end
     * @returns {number} Distance
     */
    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
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
            source: { ...this.source },
            target: { ...this.target },
            waypoints: this.waypoints.map(p => ({ x: p.x, y: p.y })),
            properties: { ...this.properties },
            style: { ...this.style }
        };
    }

    /**
     * Create connection from JSON
     * @param {Object} data - JSON data
     * @returns {Connection}
     */
    static fromJSON(data) {
        const conn = new Connection(data);
        conn.waypoints = (data.waypoints || []).map(p => new Point(p.x, p.y));
        return conn;
    }
}
