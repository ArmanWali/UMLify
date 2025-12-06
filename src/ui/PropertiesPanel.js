/**
 * Properties Panel UI Component
 */

import { EventBus, Events } from '../core/EventBus.js';
import { PluginRegistry } from '../core/PluginRegistry.js';
import { UpdatePropertyCommand, UpdateStyleCommand } from '../commands/Commands.js';
import { CommandManager } from '../core/CommandManager.js';

export class PropertiesPanel {
    constructor() {
        this.container = document.getElementById('properties-panel');
        this.content = document.getElementById('properties-content');
        this.form = document.getElementById('properties-form');
        this.emptyState = this.content.querySelector('.properties__empty');

        this.currentElement = null;

        this.eventBus = EventBus.getInstance();
        this.pluginRegistry = PluginRegistry.getInstance();
        this.commandManager = CommandManager.getInstance();

        this.init();
    }

    init() {
        // Listen for selection changes
        this.eventBus.on(Events.SELECTION_CHANGED, this.handleSelectionChanged.bind(this));
        this.eventBus.on(Events.SHAPE_UPDATED, this.handleElementUpdated.bind(this));

        // Form input handlers
        this.setupFormHandlers();

        // Collapse button
        const collapseBtn = document.getElementById('btn-collapse-properties');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => this.toggleCollapse());
        }
    }

    setupFormHandlers() {
        // Name input
        const nameInput = document.getElementById('prop-name');
        if (nameInput) {
            nameInput.addEventListener('change', (e) => {
                this.updateProperty('name', e.target.value);
            });
        }

        // Stereotype input
        const stereotypeInput = document.getElementById('prop-stereotype');
        if (stereotypeInput) {
            stereotypeInput.addEventListener('change', (e) => {
                this.updateProperty('stereotype', e.target.value);
            });
        }

        // Position inputs
        const xInput = document.getElementById('prop-x');
        const yInput = document.getElementById('prop-y');
        if (xInput) {
            xInput.addEventListener('change', (e) => {
                if (this.currentElement) {
                    this.currentElement.setPosition(parseInt(e.target.value), this.currentElement.y);
                }
            });
        }
        if (yInput) {
            yInput.addEventListener('change', (e) => {
                if (this.currentElement) {
                    this.currentElement.setPosition(this.currentElement.x, parseInt(e.target.value));
                }
            });
        }

        // Size inputs
        const widthInput = document.getElementById('prop-width');
        const heightInput = document.getElementById('prop-height');
        if (widthInput) {
            widthInput.addEventListener('change', (e) => {
                if (this.currentElement) {
                    this.currentElement.setSize(parseInt(e.target.value), this.currentElement.height);
                }
            });
        }
        if (heightInput) {
            heightInput.addEventListener('change', (e) => {
                if (this.currentElement) {
                    this.currentElement.setSize(this.currentElement.width, parseInt(e.target.value));
                }
            });
        }

        // Color inputs
        const fillInput = document.getElementById('prop-fill');
        const strokeInput = document.getElementById('prop-stroke');
        if (fillInput) {
            fillInput.addEventListener('change', (e) => {
                this.updateStyle('fill', e.target.value);
            });
        }
        if (strokeInput) {
            strokeInput.addEventListener('change', (e) => {
                this.updateStyle('stroke', e.target.value);
            });
        }
    }

    handleSelectionChanged({ primary, count }) {
        if (count === 0 || !primary) {
            this.showEmptyState();
            this.currentElement = null;
            return;
        }

        this.currentElement = primary;
        this.showProperties(primary);
    }

    handleElementUpdated({ shape }) {
        if (this.currentElement && this.currentElement.id === shape.id) {
            this.refreshProperties();
        }
    }

    showEmptyState() {
        this.emptyState.style.display = 'flex';
        this.form.style.display = 'none';
    }

    showProperties(element) {
        this.emptyState.style.display = 'none';
        this.form.style.display = 'flex';

        // Update form values
        this.refreshProperties();
    }

    refreshProperties() {
        if (!this.currentElement) return;

        const elem = this.currentElement;

        // Name
        const nameInput = document.getElementById('prop-name');
        if (nameInput) {
            nameInput.value = elem.properties?.name || '';
        }

        // Stereotype
        const stereotypeInput = document.getElementById('prop-stereotype');
        if (stereotypeInput) {
            stereotypeInput.value = elem.properties?.stereotype || '';
        }

        // Position
        document.getElementById('prop-x').value = Math.round(elem.x);
        document.getElementById('prop-y').value = Math.round(elem.y);

        // Size
        document.getElementById('prop-width').value = Math.round(elem.width);
        document.getElementById('prop-height').value = Math.round(elem.height);

        // Colors
        const fillInput = document.getElementById('prop-fill');
        const strokeInput = document.getElementById('prop-stroke');
        if (fillInput && elem.style) {
            fillInput.value = elem.style.fill || '#FFFFFF';
        }
        if (strokeInput && elem.style) {
            strokeInput.value = elem.style.stroke || '#333333';
        }
    }

    updateProperty(key, value) {
        if (!this.currentElement) return;

        const oldValue = this.currentElement.properties[key];
        if (oldValue === value) return;

        const command = new UpdatePropertyCommand(
            this.currentElement,
            key,
            oldValue,
            value
        );
        this.commandManager.execute(command);
    }

    updateStyle(key, value) {
        if (!this.currentElement) return;

        const oldStyle = { ...this.currentElement.style };
        const newStyle = { ...oldStyle, [key]: value };

        const command = new UpdateStyleCommand(
            this.currentElement,
            oldStyle,
            newStyle
        );
        this.commandManager.execute(command);
    }

    toggleCollapse() {
        this.container.classList.toggle('properties--collapsed');
    }
}
