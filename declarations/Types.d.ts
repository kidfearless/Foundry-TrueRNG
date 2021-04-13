import { TrueRNG } from "./TrueRNG.js";
export declare class Ref<T> {
    Reference: T;
    constructor(value: T);
}
export declare type RNGFunction = {
    (): number;
};
export declare type PreRNGEvent = {
    (self: TrueRNG, getRandomNumber: Ref<RNGFunction>): boolean | undefined;
};
export declare type PostRNGEvent = {
    (self: TrueRNG, resultReference: Ref<number>): void;
};
