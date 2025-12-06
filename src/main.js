/**
 * UMLify - Main Application Entry Point
 * Initializes all components and starts the application
 */

// Core imports
import { EventBus, Events } from './core/EventBus.js';
import { CommandManager } from './core/CommandManager.js';
import { PluginRegistry } from './core/PluginRegistry.js';

// Model
import { Diagram } from './model/Diagram.js';

// Canvas
import { SVGCanvas } from './canvas/SVGCanvas.js';
import { SelectionManager } from './canvas/SelectionManager.js';
import { InteractionController } from './canvas/InteractionController.js';
import { ResizeHandleManager } from './canvas/ResizeHandleManager.js';
import { TextEditor } from './canvas/TextEditor.js';

// UI
import { Toolbar } from './ui/Toolbar.js';
import { PropertiesPanel } from './ui/PropertiesPanel.js';
import { DiagramSelector } from './ui/DiagramSelector.js';

// Plugins
import { SequencePlugin } from './plugins/sequence/SequencePlugin.js';
import { ClassPlugin } from './plugins/class/ClassPlugin.js';
import { UseCasePlugin } from './plugins/usecase/UseCasePlugin.js';
import { StatePlugin } from './plugins/state/StatePlugin.js';
import { ActivityPlugin } from './plugins/activity/ActivityPlugin.js';
import { ERDPlugin } from './plugins/erd/ERDPlugin.js';
import { ComponentPlugin } from './plugins/component/ComponentPlugin.js';
import { PackagePlugin } from './plugins/package/PackagePlugin.js';

/**
 * UMLify Application
 */
class UMLifyApp {
    constructor() {
        console.log('Initializing UMLify...');

        // Core singletons
        this.eventBus = EventBus.getInstance();
        this.commandManager = CommandManager.getInstance();
        this.pluginRegistry = PluginRegistry.getInstance();

        // Current diagram
        this.diagram = new Diagram({ type: 'sequence', name: 'My Diagram' });

        // Initialize components
        this.init();
    }

    init() {
        // Register plugins
        this.registerPlugins();

        // Initialize canvas
        this.canvas = new SVGCanvas('#canvas-container', '#canvas');
        this.selectionManager = new SelectionManager();
        this.interactionController = new InteractionController(
            this.canvas,
            this.diagram,
            this.selectionManager
        );

        // Initialize resize handles and text editor
        this.resizeHandleManager = new ResizeHandleManager(this.canvas, this.selectionManager);
        this.textEditor = new TextEditor(this.canvas);

        // Pass text editor reference to interaction controller
        this.interactionController.setTextEditor(this.textEditor);

        // Initialize UI components
        this.toolbar = new Toolbar();
        this.propertiesPanel = new PropertiesPanel();
        this.diagramSelector = new DiagramSelector();

        // Setup event listeners
        this.setupEventListeners();

        // Activate default diagram type
        this.pluginRegistry.activate('sequence');

        // Setup header buttons
        this.setupHeaderButtons();

        console.log('UMLify initialized successfully!');
    }

    registerPlugins() {
        // Register all 8 diagram type plugins
        this.pluginRegistry.register(new SequencePlugin());
        this.pluginRegistry.register(new ClassPlugin());
        this.pluginRegistry.register(new UseCasePlugin());
        this.pluginRegistry.register(new StatePlugin());
        this.pluginRegistry.register(new ActivityPlugin());
        this.pluginRegistry.register(new ERDPlugin());
        this.pluginRegistry.register(new ComponentPlugin());
        this.pluginRegistry.register(new PackagePlugin());

        console.log('Registered plugins:', this.pluginRegistry.getPluginIds());
    }

    setupEventListeners() {
        // Listen for undo/redo history changes
        this.eventBus.on(Events.HISTORY_CHANGED, this.updateUndoRedoButtons.bind(this));

        // Listen for diagram modifications
        this.eventBus.on(Events.DIAGRAM_MODIFIED, () => {
            // Could auto-save here
            document.title = 'UMLify - ' + this.diagram.name + ' *';
        });

        // Listen for connection additions
        this.eventBus.on(Events.CONNECTION_ADDED, ({ connection }) => {
            connection.render(this.canvas.getConnectionLayer());
        });
    }

    setupHeaderButtons() {
        // Undo button
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.commandManager.undo();
            });
        }

        // Redo button
        const redoBtn = document.getElementById('btn-redo');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.commandManager.redo();
            });
        }

        // Save button
        const saveBtn = document.getElementById('btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveDiagram();
            });
        }

        // Export button
        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportDiagram();
            });
        }

        // Initial button states
        this.updateUndoRedoButtons(this.commandManager.getState());
    }

    updateUndoRedoButtons({ canUndo, canRedo }) {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        if (undoBtn) undoBtn.disabled = !canUndo;
        if (redoBtn) redoBtn.disabled = !canRedo;
    }

    saveDiagram() {
        const json = this.diagram.toJSON();
        const jsonString = JSON.stringify(json, null, 2);

        // Save to localStorage
        localStorage.setItem('umlify-diagram', jsonString);

        // Also offer download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.diagram.name || 'diagram'}.uml.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('Diagram saved');
        document.title = 'UMLify - ' + this.diagram.name;
    }

    exportDiagram() {
        // Export as SVG
        const svgElement = document.getElementById('canvas').cloneNode(true);

        // Remove grid for export
        const gridLayer = svgElement.querySelector('#grid-layer');
        if (gridLayer) gridLayer.remove();

        // Remove interaction layer
        const interactionLayer = svgElement.querySelector('#interaction-layer');
        if (interactionLayer) interactionLayer.remove();

        // Set viewBox to fit content
        // TODO: Calculate proper bounding box

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.diagram.name || 'diagram'}.svg`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('Diagram exported as SVG');
    }

    loadDiagram() {
        const saved = localStorage.getItem('umlify-diagram');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // TODO: Implement proper loading with shape factory
                console.log('Loaded diagram:', data);
            } catch (e) {
                console.error('Error loading diagram:', e);
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.umlify = new UMLifyApp();
});

export { UMLifyApp };
