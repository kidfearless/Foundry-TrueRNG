import { IGenerateIntegers, IRandomData, IRandomDecimalData, IGenerateDecimalFractions } from './interfaces.js';
export declare class RandomAPI {
    ApiKey: string;
    EndPoint: string;
    BitsLeft: number;
    BitsUsed: number;
    RequestsLeft: number;
    /**
     * Creates an instance of RandomAPI with the given random.org api key.
     * @param {string} apiKey
     * @memberof RandomAPI
     */
    constructor(apiKey: string);
    private GetResponse;
    /**
     * Generate random numbers with the given requirements
     *
     * @param {IGenerateIntegers} parameters specifies the minimum, maximum, and quantity of numbers generated
     * @param {*} [id=0] an optional id to pass to identify the api request
     *
     * @return {Promise<IRandomData>} A promise with the random data within it
     * @memberof RandomAPI
     */
    GenerateIntegers(parameters: IGenerateIntegers, id?: any): Promise<IRandomData>;
    /**
     * Generate random numbers between 0 and 1 with the given requirements
     *
     * @param {IGenerateDecimalFractions} parameters specifies the decimal places, and quantity of numbers generated
     * @param {*} [id=0] an optional id to pass to identify the api request
     *
     * @return {Promise<IRandomDecimalData>} A promise with the random data within it
     * @memberof RandomAPI
     */
    GenerateDecimals(parameters: IGenerateDecimalFractions, id?: any): Promise<IRandomDecimalData>;
}
