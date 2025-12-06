/**
 * PluginRegistry - Strategy Pattern Implementation
 * Manages diagram type plugins and provides diagram-specific behaviors
 */

import { EventBus, Events } from './EventBus.js';

/**
 * DiagramPlugin Interface
 * Each diagram type must implement this interface
 */
export class DiagramPlugin {
    constructor() {
        if (this.constructor === DiagramPlugin) {
            throw new Error('DiagramPlugin is abstract and cannot be instantiated');
        }
    }

    // Identity
    get id() { throw new Error('Must implement id getter'); }
    get name() { throw new Error('Must implement name getter'); }
    get icon() { throw new Error('Must implement icon getter'); }
    get color() { return '#666666'; }

    // Tools
    getShapeTools() { return []; }
    getConnectorTools() { return []; }

    // Shape definitions
    getShapeDefinitions() { return {}; }

    // Connection rules
    getConnectorTypes() { return []; }
    validateConnection(sourceShape, targetShape, connectorType) { return true; }

    // Rendering
    renderShape(shape, svgContext) { throw new Error('Must implement renderShape'); }
    renderConnector(connection, svgContext) { throw new Error('Must implement renderConnector'); }

    // Property editors
    getPropertyEditors(element) { return []; }

    // Lifecycle
    onActivate() { }
    onDeactivate() { }
}

/**
 * PluginRegistry - Singleton
 * Manages all diagram type plugins
 */
export class PluginRegistry {
    static #instance = null;

    constructor() {
        if (PluginRegistry.#instance) {
            return PluginRegistry.#instance;
        }

        this.plugins = new Map();
        this.activePlugin = null;
        this.eventBus = EventBus.getInstance();

        PluginRegistry.#instance = this;
    }

    static getInstance() {
        if (!PluginRegistry.#instance) {
            PluginRegistry.#instance = new PluginRegistry();
        }
        return PluginRegistry.#instance;
    }

    /**
     * Register a diagram plugin
     * @param {DiagramPlugin} plugin - Plugin instance
     */
    register(plugin) {
        if (!(plugin instanceof DiagramPlugin)) {
            throw new Error('Plugin must extend DiagramPlugin');
        }
        this.plugins.set(plugin.id, plugin);
        console.log(`Registered plugin: ${plugin.name}`);
    }

    /**
     * Get a plugin by ID
     * @param {string} id - Plugin ID
     * @returns {DiagramPlugin}
     */
    get(id) {
        return this.plugins.get(id);
    }

    /**
     * Get all registered plugins
     * @returns {DiagramPlugin[]}
     */
    getAll() {
        return Array.from(this.plugins.values());
    }

    /**
     * Get all plugin IDs
     * @returns {string[]}
     */
    getPluginIds() {
        return Array.from(this.plugins.keys());
    }

    /**
     * Activate a plugin (switch diagram type)
     * @param {string} id - Plugin ID
     */
    activate(id) {
        const plugin = this.plugins.get(id);
        if (!plugin) {
            throw new Error(`Plugin not found: ${id}`);
        }

        // Deactivate current plugin
        if (this.activePlugin) {
            this.activePlugin.onDeactivate();
        }

        // Activate new plugin
        this.activePlugin = plugin;
        plugin.onActivate();

        this.eventBus.emit(Events.DIAGRAM_TYPE_CHANGED, {
            pluginId: id,
            plugin: plugin
        });

        console.log(`Activated plugin: ${plugin.name}`);
    }

    /**
     * Get the currently active plugin
     * @returns {DiagramPlugin}
     */
    getActive() {
        return this.activePlugin;
    }

    /**
     * Check if a plugin is registered
     * @param {string} id - Plugin ID
     * @returns {boolean}
     */
    has(id) {
        return this.plugins.has(id);
    }
}

/**
 * Tool Definition
 * Represents a tool in the toolbar
 */
export class ToolDefinition {
    constructor({ id, name, icon, type = 'shape', shortcut = null, cursor = 'crosshair' }) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.type = type; // 'shape', 'connector', 'action'
        this.shortcut = shortcut;
        this.cursor = cursor;
    }
}

/**
 * ShapeDefinition
 * Defines how a shape type is created and rendered
 */
export class ShapeDefinition {
    constructor({
        type,
        name,
        defaultWidth = 120,
        defaultHeight = 60,
        minWidth = 40,
        minHeight = 30,
        resizable = true,
        hasText = true,
        connectionPoints = ['top', 'right', 'bottom', 'left']
    }) {
        this.type = type;
        this.name = name;
        this.defaultWidth = defaultWidth;
        this.defaultHeight = defaultHeight;
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.resizable = resizable;
        this.hasText = hasText;
        this.connectionPoints = connectionPoints;
    }
}

/**
 * ConnectorDefinition
 * Defines how a connector type is created and rendered
 */
export class ConnectorDefinition {
    constructor({
        type,
        name,
        lineStyle = 'solid', // 'solid', 'dashed', 'dotted'
        sourceArrow = 'none',
        targetArrow = 'filled',
        validSources = [], // Empty means all
        validTargets = []  // Empty means all
    }) {
        this.type = type;
        this.name = name;
        this.lineStyle = lineStyle;
        this.sourceArrow = sourceArrow;
        this.targetArrow = targetArrow;
        this.validSources = validSources;
        this.validTargets = validTargets;
    }
}
