/**
 * ShapeFactory - Factory Pattern Implementation
 * Creates shapes based on type
 */

import { Shape } from './Shape.js';

class ShapeFactoryClass {
    constructor() {
        this.shapeClasses = new Map();
        this.shapeDefaults = new Map();
    }

    /**
     * Register a shape class for a type
     * @param {string} type - Shape type
     * @param {Function} ShapeClass - Shape class constructor
     * @param {Object} defaults - Default properties
     */
    register(type, ShapeClass, defaults = {}) {
        this.shapeClasses.set(type, ShapeClass);
        this.shapeDefaults.set(type, defaults);
    }

    /**
     * Create a shape
     * @param {string} type - Shape type
     * @param {Object} options - Shape options
     * @returns {Shape}
     */
    create(type, options = {}) {
        const ShapeClass = this.shapeClasses.get(type) || Shape;
        const defaults = this.shapeDefaults.get(type) || {};

        return new ShapeClass({
            type,
            ...defaults,
            ...options
        });
    }

    /**
     * Check if a type is registered
     * @param {string} type - Shape type
     * @returns {boolean}
     */
    has(type) {
        return this.shapeClasses.has(type);
    }

    /**
     * Get all registered types
     * @returns {string[]}
     */
    getTypes() {
        return Array.from(this.shapeClasses.keys());
    }
}

// Singleton export
export const ShapeFactory = new ShapeFactoryClass();

// Register base shape
ShapeFactory.register('rectangle', Shape, {
    width: 120,
    height: 60
});
