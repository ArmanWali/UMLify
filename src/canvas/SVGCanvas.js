/**
 * SVGCanvas - Canvas component for rendering and interaction
 */

import { EventBus, Events } from '../core/EventBus.js';
import { Point, clamp } from '../utils/geometry.js';

export class SVGCanvas {
    constructor(containerSelector, svgSelector) {
        this.container = document.querySelector(containerSelector);
        this.svg = document.querySelector(svgSelector);

        if (!this.container || !this.svg) {
            throw new Error('Canvas container or SVG not found');
        }

        // Layers
        this.gridLayer = this.svg.querySelector('#grid-layer');
        this.connectionLayer = this.svg.querySelector('#connection-layer');
        this.shapeLayer = this.svg.querySelector('#shape-layer');
        this.interactionLayer = this.svg.querySelector('#interaction-layer');

        // Viewport state
        this.viewBox = { x: 0, y: 0, width: 2000, height: 2000 };
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 3;

        // Interaction state
        this.isPanning = false;
        this.panStart = null;
        this.lastMousePosition = new Point(0, 0);

        this.eventBus = EventBus.getInstance();

        this.init();
    }

    init() {
        this.updateViewBox();
        this.setupEventListeners();
        this.updateZoomDisplay();
    }

    setupEventListeners() {
        // Mouse events on SVG
        this.svg.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.svg.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.svg.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.svg.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.svg.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        this.svg.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // Context menu
        this.svg.addEventListener('contextmenu', (e) => e.preventDefault());

        // Zoom buttons
        document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomBy(0.1));
        document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomBy(-0.1));
        document.getElementById('zoom-fit')?.addEventListener('click', () => this.fitToContent());

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Convert screen coordinates to SVG coordinates
     * @param {number} screenX - Screen X
     * @param {number} screenY - Screen Y
     * @returns {Point} SVG coordinates
     */
    screenToSVG(screenX, screenY) {
        const rect = this.svg.getBoundingClientRect();
        const x = (screenX - rect.left) / this.zoom + this.viewBox.x;
        const y = (screenY - rect.top) / this.zoom + this.viewBox.y;
        return new Point(x, y);
    }

    /**
     * Convert SVG coordinates to screen coordinates
     * @param {number} svgX - SVG X
     * @param {number} svgY - SVG Y
     * @returns {Point} Screen coordinates
     */
    svgToScreen(svgX, svgY) {
        const rect = this.svg.getBoundingClientRect();
        const x = (svgX - this.viewBox.x) * this.zoom + rect.left;
        const y = (svgY - this.viewBox.y) * this.zoom + rect.top;
        return new Point(x, y);
    }

    handleMouseDown(e) {
        const point = this.screenToSVG(e.clientX, e.clientY);

        // Middle mouse button or space+click for panning
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            this.startPan(e);
            return;
        }

        // Left click
        if (e.button === 0) {
            this.eventBus.emit(Events.CANVAS_CLICKED, {
                point,
                target: e.target,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                originalEvent: e
            });
        }
    }

    handleMouseMove(e) {
        const point = this.screenToSVG(e.clientX, e.clientY);
        this.lastMousePosition = point;

        // Update status bar position
        this.updatePositionDisplay(point);

        if (this.isPanning) {
            this.doPan(e);
            return;
        }

        this.eventBus.emit(Events.CANVAS_MOUSE_MOVE, {
            point,
            target: e.target,
            originalEvent: e
        });
    }

    handleMouseUp(e) {
        if (this.isPanning) {
            this.endPan();
        }
    }

    handleMouseLeave(e) {
        if (this.isPanning) {
            this.endPan();
        }
    }

    handleDoubleClick(e) {
        const point = this.screenToSVG(e.clientX, e.clientY);
        this.eventBus.emit('canvas:dblclick', {
            point,
            target: e.target,
            originalEvent: e
        });
    }

    handleWheel(e) {
        e.preventDefault();

        const delta = -e.deltaY * 0.001;
        const point = this.screenToSVG(e.clientX, e.clientY);

        this.zoomAtPoint(delta, point);
    }

    handleResize() {
        this.updateViewBox();
    }

    // Panning
    startPan(e) {
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.svg.classList.add('cursor-panning');
    }

    doPan(e) {
        if (!this.panStart) return;

        const dx = (e.clientX - this.panStart.x) / this.zoom;
        const dy = (e.clientY - this.panStart.y) / this.zoom;

        this.viewBox.x -= dx;
        this.viewBox.y -= dy;

        this.panStart = { x: e.clientX, y: e.clientY };
        this.updateViewBox();

        this.eventBus.emit(Events.CANVAS_PANNED, { x: this.viewBox.x, y: this.viewBox.y });
    }

    endPan() {
        this.isPanning = false;
        this.panStart = null;
        this.svg.classList.remove('cursor-panning');
    }

    // Zooming
    zoomBy(delta) {
        const center = new Point(
            this.viewBox.x + this.viewBox.width / 2,
            this.viewBox.y + this.viewBox.height / 2
        );
        this.zoomAtPoint(delta, center);
    }

    zoomAtPoint(delta, point) {
        const oldZoom = this.zoom;
        this.zoom = clamp(this.zoom + delta, this.minZoom, this.maxZoom);

        if (this.zoom === oldZoom) return;

        // Adjust viewbox to zoom towards point
        const scale = oldZoom / this.zoom;
        this.viewBox.x = point.x - (point.x - this.viewBox.x) * scale;
        this.viewBox.y = point.y - (point.y - this.viewBox.y) * scale;

        this.updateViewBox();
        this.updateZoomDisplay();

        this.eventBus.emit(Events.CANVAS_ZOOMED, { zoom: this.zoom });
    }

    setZoom(zoom) {
        this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
        this.updateViewBox();
        this.updateZoomDisplay();
    }

    fitToContent() {
        // TODO: Calculate bounding box of all shapes and fit view
        this.viewBox.x = 0;
        this.viewBox.y = 0;
        this.zoom = 1;
        this.updateViewBox();
        this.updateZoomDisplay();
    }

    updateViewBox() {
        const rect = this.container.getBoundingClientRect();
        this.viewBox.width = rect.width / this.zoom;
        this.viewBox.height = rect.height / this.zoom;

        this.svg.setAttribute('viewBox',
            `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`
        );
    }

    updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    updatePositionDisplay(point) {
        const positionDisplay = document.getElementById('status-position');
        if (positionDisplay) {
            positionDisplay.textContent = `X: ${Math.round(point.x)}, Y: ${Math.round(point.y)}`;
        }
    }

    /**
     * Set cursor style
     * @param {string} cursor - Cursor type
     */
    setCursor(cursor) {
        // Remove all cursor classes
        this.svg.className = 'canvas';
        if (cursor) {
            this.svg.classList.add(`cursor-${cursor}`);
        }
    }

    /**
     * Get the shape layer for rendering shapes
     * @returns {SVGElement}
     */
    getShapeLayer() {
        return this.shapeLayer;
    }

    /**
     * Get the connection layer for rendering connections
     * @returns {SVGElement}
     */
    getConnectionLayer() {
        return this.connectionLayer;
    }

    /**
     * Get the interaction layer for temporary elements
     * @returns {SVGElement}
     */
    getInteractionLayer() {
        return this.interactionLayer;
    }

    /**
     * Clear a layer
     * @param {SVGElement} layer - Layer to clear
     */
    clearLayer(layer) {
        while (layer.firstChild) {
            layer.removeChild(layer.firstChild);
        }
    }

    /**
     * Clear all content
     */
    clearAll() {
        this.clearLayer(this.shapeLayer);
        this.clearLayer(this.connectionLayer);
        this.clearLayer(this.interactionLayer);
    }
}
