import { IJsonRPCResponse } from "./interfaces.js";

export class JsonRPCRequest<T> {
	public readonly jsonrpc: "2.0" = "2.0";
	public method: string;
	public params: T;
	public id: any;
	constructor(method: string, params: T, id: any = 0)
	{
		this.method = method;
		this.params = params;
		this.id = id;
	}
}

export class JsonRPCResponse<T> {
	public jsonrpc: "2.0" = "2.0";
	public result: IJsonRPCResponse<T> | undefined;
	public error?: any;
	public id: any;
}