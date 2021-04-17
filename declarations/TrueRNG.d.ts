import { RandomAPI } from "./RandomAPI.js";
import { PreRNGEvent, PostRNGEvent, RNGFunction } from './Types.js';
export declare class TrueRNG {
    /**
     * An array of cached floating point random numbers that is pulled from for the RNG functions.
     *
     * @type {number[]}
     * @memberof TrueRNG
     */
    RandomNumbers: number[];
    /**
     * An instance of the RandomAPI class. All random.org API calls go through this property.
     *
     * @type {(RandomAPI | null)}
     * @memberof TrueRNG
     */
    RandomGenerator: RandomAPI | null;
    /**
     * A temporary variable used to determine if we are awaiting a response from random.org.
     * Dice rolls happen all at once when you do /r 100d20 so we don't want to make 99 api calls and burn through our quota on a single player.
     *
     * @type {boolean}
     * @memberof TrueRNG
     */
    AwaitingResponse: boolean;
    /**
     * Cached copy of it's game settings counter part. There's no real reason to cache it but here it is.
     *
     * @type {number}
     * @memberof TrueRNG
     */
    MaxCachedNumbers: number;
    /**
     * Cached copy of it's game settings counter part.
     *
     * @type {number}
     * @memberof TrueRNG
     */
    UpdatePoint: number;
    /**
     * Whether or not we've alerted the clients that they haven't entered a valid api key.
     *
     * @type {boolean}
     * @memberof TrueRNG
     */
    HasAlerted: boolean;
    /**
     * Is this module enabled right now. Allows for temporarily disabling the module without reloading the entire application by disabling a module.
     *
     * @type {boolean}
     * @memberof TrueRNG
     */
    Enabled: boolean;
    /**
     * A copy of Foundry's RNG function before we overwrote it. This is used as a fallback for when we run out of random numbers somehow.
     * To prevent having to check for null it's default value is Math.random.
     *
     * @default Math.random
     * @type {RNGFunction}
     * @memberof TrueRNG
     */
    OriginalRandomFunction: RNGFunction;
    /**
     * Function to hold a pre event handler. This is called after the state of the module has been validated but before TrueRNG.PopRandomNumber has been called.
     * Use this to run your own rng functions instead of TrueRNG's.
     *
     * @type {(PreRNGEvent | null)}
     * @memberof TrueRNG
     */
    PreRNGEventHandler: PreRNGEvent | null;
    /**
     * Function to hold a post event handler. This is called after a random number has been generated but before that number has been returned.
     * Use this to tweak the generated numbers before being returned to the user.
     *
     * @type {(PostRNGEvent | null)}
     * @memberof TrueRNG
     */
    PostRNGEventHandler: PostRNGEvent | null;
    /**
     * The last number generated. Assigned just before GetRandomNumber returns it's value. It's mostly used for debugging.
     *
     * @type {number}
     * @memberof TrueRNG
     */
    LastRandomNumber: number;
    /**
     * A reference to ON/OFF anchor tag. Always null for regular players, only the GM will have access to it.
     *
     * @type {(HTMLAnchorElement | null)}
     * @memberof TrueRNG
     */
    QuickToggleButton: HTMLAnchorElement | null;
    constructor();
    /**
     * Create a new RandomAPI instance with the given key, and pull in new random numbers.
     *
     * @param {string} key random.org api key
     * @noreturn
     * @memberof TrueRNG
     */
    UpdateAPIKey(key: string): void;
    /**
     * Generates an anchor tag and a style element for the quick toggle button. Limited only to the GM.
     *
     * @param {boolean} enabled Is this setting currently enabled or disabled.
     * @noreturn
     * @memberof TrueRNG
     */
    GenerateQuickToggleButton(enabled: boolean): void;
    /**
     * Pulls in new random numbers from random.org if we are enabled and not waiting for a response currently.
     *
     * @noreturn
     * @memberof TrueRNG
     */
    UpdateRandomNumbers(): void;
    /**
     * Returns a random number either from the cached random.org numbers or from Foundry's random function.
     *
     * @return {number} A random decimal number between 0.0 and 1.0
     * @memberof TrueRNG
     */
    GetRandomNumber(): number;
    /**
     * Picks a "random" index from the RandomNumbers array and removes the item from that index from the array and returns it.
     * Index is determined by the current time in milliseconds modulused by the length of the array.
     *
     * @return {number} random number from the cached array of random.org numbers
     * @exception {OutOfBoundsException} If the RandomNumbers.length property is 0 then this can throw an exception.
     * @memberof TrueRNG
     */
    PopRandomNumber(): number;
}
