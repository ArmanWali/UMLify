/**
 * Command Pattern Implementation
 * Provides undo/redo functionality for all diagram operations
 */

import { EventBus, Events } from './EventBus.js';

/**
 * Base Command Interface
 * All commands must implement execute() and undo()
 */
export class Command {
    constructor(description = 'Unknown action') {
        this.description = description;
        this.timestamp = Date.now();
    }

    execute() {
        throw new Error('Command.execute() must be implemented');
    }

    undo() {
        throw new Error('Command.undo() must be implemented');
    }

    getDescription() {
        return this.description;
    }
}

/**
 * CommandManager - Singleton
 * Manages command history and undo/redo operations
 */
export class CommandManager {
    static #instance = null;

    constructor() {
        if (CommandManager.#instance) {
            return CommandManager.#instance;
        }

        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 50;
        this.eventBus = EventBus.getInstance();

        CommandManager.#instance = this;
    }

    static getInstance() {
        if (!CommandManager.#instance) {
            CommandManager.#instance = new CommandManager();
        }
        return CommandManager.#instance;
    }

    /**
     * Execute a command and add it to history
     * @param {Command} command - Command to execute
     */
    execute(command) {
        try {
            command.execute();
            this.undoStack.push(command);
            this.redoStack = []; // Clear redo stack

            // Limit history size
            if (this.undoStack.length > this.maxHistory) {
                this.undoStack.shift();
            }

            this.eventBus.emit(Events.COMMAND_EXECUTED, command);
            this.eventBus.emit(Events.HISTORY_CHANGED, this.getState());
            this.eventBus.emit(Events.DIAGRAM_MODIFIED, {});

        } catch (error) {
            console.error('Error executing command:', error);
            throw error;
        }
    }

    /**
     * Undo the last command
     * @returns {boolean} Success
     */
    undo() {
        if (!this.canUndo()) {
            return false;
        }

        const command = this.undoStack.pop();
        try {
            command.undo();
            this.redoStack.push(command);

            this.eventBus.emit(Events.COMMAND_UNDONE, command);
            this.eventBus.emit(Events.HISTORY_CHANGED, this.getState());
            this.eventBus.emit(Events.DIAGRAM_MODIFIED, {});

            return true;
        } catch (error) {
            console.error('Error undoing command:', error);
            this.undoStack.push(command); // Put it back
            return false;
        }
    }

    /**
     * Redo the last undone command
     * @returns {boolean} Success
     */
    redo() {
        if (!this.canRedo()) {
            return false;
        }

        const command = this.redoStack.pop();
        try {
            command.execute();
            this.undoStack.push(command);

            this.eventBus.emit(Events.COMMAND_REDONE, command);
            this.eventBus.emit(Events.HISTORY_CHANGED, this.getState());
            this.eventBus.emit(Events.DIAGRAM_MODIFIED, {});

            return true;
        } catch (error) {
            console.error('Error redoing command:', error);
            this.redoStack.push(command); // Put it back
            return false;
        }
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    getState() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            undoDescription: this.undoStack.length > 0
                ? this.undoStack[this.undoStack.length - 1].getDescription()
                : null,
            redoDescription: this.redoStack.length > 0
                ? this.redoStack[this.redoStack.length - 1].getDescription()
                : null,
            historyLength: this.undoStack.length
        };
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.eventBus.emit(Events.HISTORY_CHANGED, this.getState());
    }
}

/**
 * Composite Command - Groups multiple commands as one
 */
export class CompositeCommand extends Command {
    constructor(commands = [], description = 'Multiple actions') {
        super(description);
        this.commands = commands;
    }

    execute() {
        this.commands.forEach(cmd => cmd.execute());
    }

    undo() {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }

    add(command) {
        this.commands.push(command);
    }
}
