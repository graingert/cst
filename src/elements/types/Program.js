/* @flow */

import type Token from '../Token';
import type Node from '../Node';
import type Element from '../Element';
import type ElementAssert from '../ElementAssert';
import type BasePlugin from '../../plugins/BasePlugin';
import Statement from '../Statement';
import Traverse from '../../Traverse';

export default class Program extends Statement {
    constructor(childNodes: Array<any>) {
        super('Program', childNodes);

        this._isProgram = true;
        this._searchIndex = new Traverse();
        this._searchIndex.addElements(childNodes);
        this._eventListeners = {};
    }

    _eventListeners: {[key: string]: Function[]};
    _searchIndex: Traverse;
    _body: Array<any>;
    _isProgram: boolean;
    _plugins: {[key: string]: BasePlugin};

    _acceptPlugins(plugins: {[key: string]: BasePlugin}) {
        Object.freeze(plugins);
        this._plugins = plugins;
    }

    get plugins(): {[key: string]: BasePlugin} {
        return this._plugins;
    }

    _acceptChildren(children: ElementAssert) {
        if (children.isToken('Hashbang')) {
            children.passToken('Hashbang');
        }

        children.skipNonCode();

        let body = [];
        while (children.isStatement()) {
            body.push(children.passStatement());
            children.skipNonCode();
        }

        children.passToken('EOF');
        children.assertEnd();

        this._body = body;
    }

    /**
     * Returns node list with specified type from the tree.
     *
     * @param {String} type
     * @returns {Node[]}
     */
    selectNodesByType(type: string): Array<Node> {
        return this._searchIndex.selectNodesByType(type);
    }

    /**
     * Returns tokens list with specified type from the tree.
     *
     * @param {String} type
     * @returns {Token[]}
     */
    selectTokensByType(type: string): Array<Token> {
        return this._searchIndex.selectTokensByType(type);
    }

    _addElementsToProgram(elements: Array<Element>) {
        this._searchIndex.addElements(elements);
        this._emit('elements-add', elements);
    }

    _removeElementsFromProgram(elements: Array<Element>) {
        this._searchIndex.removeElements(elements);
        this._emit('elements-remove', elements);
    }

    get body(): Array<any> {
        return this._body.concat();
    }

    on(eventName: string, callback: Function) {
        if (this._eventListeners[eventName]) {
            this._eventListeners[eventName].push(callback);
        } else {
            this._eventListeners[eventName] = [callback];
        }
    }

    off(eventName: string, callback: Function) {
        if (this._eventListeners[eventName]) {
            this._eventListeners[eventName] = this._eventListeners[eventName].filter((handler) => {
                return callback !== handler;
            });
        }
    }

    _emit(eventName: string, data: any) {
        var handlers = this._eventListeners[eventName];
        if (handlers) {
            for (let i = 0; i < handlers.length; i++) {
                handlers[i](data);
            }
        }
    }
};
