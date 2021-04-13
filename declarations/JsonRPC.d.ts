import { IJsonRPCResponse } from "./interfaces.js";
export declare class JsonRPCRequest<T> {
    readonly jsonrpc: "2.0";
    method: string;
    params: T;
    id: any;
    constructor(method: string, params: T, id?: any);
}
export declare class JsonRPCResponse<T> {
    jsonrpc: "2.0";
    result: IJsonRPCResponse<T> | undefined;
    error?: any;
    id: any;
}
