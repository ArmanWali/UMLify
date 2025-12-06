/**
 * Diagram Selector UI Component
 * Handles diagram type tab switching
 */

import { EventBus, Events } from '../core/EventBus.js';
import { PluginRegistry } from '../core/PluginRegistry.js';

export class DiagramSelector {
    constructor() {
        this.tabsContainer = document.getElementById('diagram-tabs');
        this.eventBus = EventBus.getInstance();
        this.pluginRegistry = PluginRegistry.getInstance();

        this.init();
    }

    init() {
        // Setup tab click handlers
        this.tabsContainer.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const diagramType = tab.dataset.diagram;
                this.selectDiagram(diagramType);
            });
        });
    }

    selectDiagram(diagramType) {
        // Check if plugin exists
        if (!this.pluginRegistry.has(diagramType)) {
            console.warn(`Plugin not found for diagram type: ${diagramType}`);
            return;
        }

        // Update UI
        this.tabsContainer.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('tab--active', tab.dataset.diagram === diagramType);
        });

        // Activate plugin
        this.pluginRegistry.activate(diagramType);

        // Update status bar
        const statusMode = document.getElementById('status-mode');
        if (statusMode) {
            const plugin = this.pluginRegistry.get(diagramType);
            statusMode.textContent = `Mode: ${plugin.name}`;
        }
    }

    getCurrentDiagram() {
        const activeTab = this.tabsContainer.querySelector('.tab--active');
        return activeTab?.dataset.diagram || 'sequence';
    }
}
