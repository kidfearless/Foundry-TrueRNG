
/**
 * A simple event framework used throughout Foundry Virtual Tabletop.
 * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
 * This class manages the registration and execution of hooked callback functions.
 */
export declare class Hooks
{
	static _hooks: {};
	static _once: [];
	static _ids: {};
	static _id: number;
	/**
	 * Register a callback handler which should be triggered when a hook is triggered.
	 *
	 * @param {string} hook   The unique name of the hooked event
	 * @param {Function} fn   The callback function which should be triggered when the hook event occurs
	 * @return {number}       An ID number of the hooked function which can be used to turn off the hook later
	 */
	static on(hook: string, fn: Function): number;

	/* -------------------------------------------- */

	/**
	 * Register a callback handler for an event which is only triggered once the first time the event occurs.
	 * After a "once" hook is triggered the hook is automatically removed.
	 *
	 * @param {string} hook   The unique name of the hooked event
	 * @param {Function} fn   The callback function which should be triggered when the hook event occurs
	 * @return {number}       An ID number of the hooked function which can be used to turn off the hook later
	 */
	static once(hook: string, fn: Function): number;

	/* -------------------------------------------- */

	/**
	 * Unregister a callback handler for a particular hook event
	 *
	 * @param {string} hook           The unique name of the hooked event
	 * @param {Function|number} fn    The function, or ID number for the function, that should be turned off
	 */
	static off(hook: string, fn: Function | number);
	/* -------------------------------------------- */

	/**
	 * Call all hook listeners in the order in which they were registered
	 * Hooks called this way can not be handled by returning false and will always trigger every hook callback.
	 *
	 * @param {string} hook   The hook being triggered
	 * @param {...*} args     Arguments passed to the hook callback functions
	 */
	static callAll(hook: string, ...args: any[]);

	/* -------------------------------------------- */

	/**
	 * Call hook listeners in the order in which they were registered.
	 * Continue calling hooks until either all have been called or one returns `false`.
	 *
	 * Hook listeners which return `false` denote that the original event has been adequately handled and no further
	 * hooks should be called.
	 *
	 * @param {string} hook   The hook being triggered
	 * @param {...*} args      Arguments passed to the hook callback functions
	 */
	static call(hook: string, ...args: any[]);

	/* -------------------------------------------- */

	/**
	 * Call a hooked function using provided arguments and perhaps unregister it.
	 * @private
	 */
	static _call(hook: string, fn: number | Function, args: any[]);
}

// Static class attributes
