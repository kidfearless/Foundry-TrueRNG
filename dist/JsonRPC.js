export class JsonRPCRequest {
    constructor(method, params, id = 0) {
        this.jsonrpc = "2.0";
        this.method = method;
        this.params = params;
        this.id = id;
    }
}
export class JsonRPCResponse {
    constructor() {
        this.jsonrpc = "2.0";
    }
}
//# sourceMappingURL=JsonRPC.js.map