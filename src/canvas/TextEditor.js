/**
 * TextEditor - Handles in-place text editing for shapes
 */

import { EventBus, Events } from '../core/EventBus.js';

export class TextEditor {
    constructor(canvas) {
        this.canvas = canvas;
        this.eventBus = EventBus.getInstance();

        this.activeShape = null;
        this.inputElement = null;
        this.propertyKey = 'name'; // Default property to edit

        this.init();
    }

    init() {
        // Create the input container (hidden by default)
        this.createInputElement();
    }

    createInputElement() {
        // Create a container div for the input
        this.container = document.createElement('div');
        this.container.className = 'text-editor-container';
        this.container.style.cssText = `
            position: absolute;
            display: none;
            z-index: 1000;
        `;

        // Create the actual input
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'text-editor-input';
        this.inputElement.style.cssText = `
            font-family: var(--font-family, 'Inter', sans-serif);
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            border: 2px solid #0066FF;
            border-radius: 4px;
            padding: 4px 8px;
            outline: none;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            min-width: 80px;
        `;

        // Handle events
        this.inputElement.addEventListener('blur', this.finishEditing.bind(this));
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.finishEditing();
            } else if (e.key === 'Escape') {
                this.cancelEditing();
            }
        });

        this.container.appendChild(this.inputElement);
        document.body.appendChild(this.container);
    }

    /**
     * Start editing text for a shape
     * @param {Shape} shape - Shape to edit
     * @param {string} propertyKey - Property key to edit (default: 'name')
     */
    startEditing(shape, propertyKey = 'name') {
        if (this.activeShape) {
            this.finishEditing();
        }

        this.activeShape = shape;
        this.propertyKey = propertyKey;

        // Get shape position in screen coordinates
        const bounds = shape.getBounds();
        const screenPos = this.canvas.svgToScreen(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2
        );

        // Position the input
        const inputWidth = Math.max(bounds.width, 100);
        this.container.style.left = `${screenPos.x - inputWidth / 2}px`;
        this.container.style.top = `${screenPos.y - 15}px`;
        this.container.style.display = 'block';

        this.inputElement.style.width = `${inputWidth}px`;
        this.inputElement.value = shape.properties[propertyKey] || '';

        // Focus and select
        setTimeout(() => {
            this.inputElement.focus();
            this.inputElement.select();
        }, 10);

        // Hide the shape's text temporarily
        if (shape.element) {
            const textEl = shape.element.querySelector('.shape__text--name');
            if (textEl) {
                textEl.style.opacity = '0';
            }
        }
    }

    /**
     * Finish editing and save changes
     */
    finishEditing() {
        if (!this.activeShape) return;

        const newValue = this.inputElement.value;
        const oldValue = this.activeShape.properties[this.propertyKey];

        if (newValue !== oldValue) {
            this.activeShape.setProperty(this.propertyKey, newValue);
            this.eventBus.emit(Events.SHAPE_UPDATED, { shape: this.activeShape });
        }

        this.cleanup();
    }

    /**
     * Cancel editing without saving
     */
    cancelEditing() {
        this.cleanup();
    }

    /**
     * Cleanup after editing
     */
    cleanup() {
        // Show shape text again
        if (this.activeShape && this.activeShape.element) {
            const textEl = this.activeShape.element.querySelector('.shape__text--name');
            if (textEl) {
                textEl.style.opacity = '1';
            }
        }

        this.container.style.display = 'none';
        this.activeShape = null;
    }

    /**
     * Check if currently editing
     */
    isEditing() {
        return this.activeShape !== null;
    }
}
