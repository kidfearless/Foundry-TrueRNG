import { TrueRNG } from "./TrueRNG.js";
/**
 * A dummy object that can be used to pass a primitive by reference
 */
export declare class Ref<T> {
    Reference: T;
    constructor(value: T);
}
export type RNGFunction = {
    /**
     * @returns A floating point number between 0.0 and 1.0. For a 1d20 1.0 would be a 20.
     */
    (): number;
};
export type PreRNGEvent = {
    /**
     * Event callback function that is fired before the cached numbers gets updated and a new number is pulled.
     * It contains a reference to the TrueRNG object and an object containing the function it will use to get a random number.
     *
     * @param self				Reference to the TrueRNG object, allowing for modifications to it's properties and functions.
     * @param getRandomNumber	An object containing a copy of function to be called to get a random number.
     * 							Modify the function in this parameter to change the outcome of a single roll.
     * 							Modify the TrueRNG.PopRandomNumber to change the outcome of every dice roll.
     *
     * @returns return true to block TrueRNG's functionality and use Foundry's instead. false to continue normal functionality.
     */
    (self: TrueRNG, getRandomNumber: Ref<RNGFunction>): boolean | void;
};
export type PostRNGEvent = {
    /**
     * Fired after a random number has been pulled.
     *
     * @param self				Reference to the TrueRNG object, allowing for modifications to it's properties and functions.
     * @param resultReference	A reference to the random number generated.
     * 							Change the Reference property if you wish to modify the dice roll
     * @noreturn
     */
    (self: TrueRNG, resultReference: Ref<number>): void;
};
