import { RandomAPI } from "./RandomAPI.js";
import { PreRNGEvent, PostRNGEvent, RNGFunction } from './Types.js';
export declare class TrueRNG {
    RandomNumbers: number[];
    RandomGenerator: RandomAPI | null;
    AwaitingResponse: boolean;
    MaxCachedNumbers: number;
    UpdatePoint: number;
    HasAlerted: boolean;
    Enabled: boolean;
    OriginalRandomFunction: RNGFunction;
    PreRNGEventHandler: PreRNGEvent | null;
    PostRNGEventHandler: PostRNGEvent | null;
    LastRandomNumber: number;
    constructor();
    UpdateAPIKey(key: string): void;
    UpdateRandomNumbers(): void;
    GetRandomNumber(): number;
    PopRandomNumber(): number;
}
