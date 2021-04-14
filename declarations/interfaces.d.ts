declare type int = number;
export interface IKeyed {
    apiKey?: string;
}
export interface ILimitedResponse extends IKeyed {
    /**
     * How many random decimal fractions you need. Must be within the [1, 10000] range.
     *
     * @type {int}
     * @memberof ILimitedResponse
     */
    n: int;
}
export interface IReplacement {
    replacement?: boolean;
}
export interface IIntegerMethods extends ILimitedResponse, IReplacement {
    /**
     * The lower boundary for the range from which the random numbers will be picked. Must be within the [-1e9,1e9] range.
     *
     * @type {int}
     * @memberof IIntegerMethods
     */
    min: int;
    /**
     * The upper boundary for the range from which the random numbers will be picked. Must be within the [-1e9,1e9] range.
     *
     * @type {int}
     * @memberof IIntegerMethods
     */
    max: int;
}
export interface IGenerateIntegers extends IIntegerMethods {
    /**
     * Specifies whether the random numbers should be picked with replacement. The default (true) will cause the numbers to be picked with replacement, i.e., the resulting numbers may contain duplicate values (like a series of dice rolls). If you want the numbers picked to be unique (like raffle tickets drawn from a container), set this value to false.
     *
     * @type {boolean}
     * @memberof IGenerateIntegers
     */
    base?: 2 | 8 | 10 | 16;
}
export interface IGenerateIntegerSequences extends IIntegerMethods {
    length: int;
    base?: 2 | 8 | 10 | 16;
}
export interface IGenerateDecimalFractions extends ILimitedResponse {
    decimalPlaces: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
}
export interface IGenerateGaussians extends ILimitedResponse {
    mean: number;
    standardDeviation: int;
    significantDigits: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
}
export interface IGenerateStrings extends ILimitedResponse, IReplacement {
    length: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32;
    characters: string;
}
export declare type IGenerateUUIDs = ILimitedResponse;
export interface IGenerateBlobs extends ILimitedResponse {
    size: int;
    format?: "base64" | "hex";
}
export declare type IGetUsage = IKeyed;
export interface IJsonRPCResponse<T> {
    random: T;
    bitsUsed: int;
    bitsLeft: int;
    requestsLeft: int;
    advisoryDelay: int;
}
export interface IRandomData {
    data: string[] | int[];
    completionTime: string;
}
export interface IRandomDecimalData {
    data: number[];
    completionTime: string;
}
export {};
