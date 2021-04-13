import { IGenerateIntegers, IRandomData, IRandomDecimalData, IGenerateDecimalFractions } from './interfaces.js';
export declare class RandomAPI {
    ApiKey: string;
    EndPoint: string;
    BitsLeft: number;
    BitsUsed: number;
    RequestsLeft: number;
    constructor(apiKey: string);
    private GetResponse;
    GenerateIntegers(parameters: IGenerateIntegers, id?: any): Promise<IRandomData>;
    GenerateDecimals(parameters: IGenerateDecimalFractions, id?: any): Promise<IRandomDecimalData>;
}
