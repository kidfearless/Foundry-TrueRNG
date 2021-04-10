import { JsonRPCRequest } from './JsonRPC.js';
export class RandomAPI {
    constructor(apiKey, endPoint = "https://api.random.org/json-rpc/4/invoke") {
        this.ApiKey = "https://api.random.org/json-rpc/4/invoke";
        this.BitsLeft = Number.MAX_SAFE_INTEGER;
        this.BitsUsed = 0;
        this.RequestsLeft = Number.MAX_SAFE_INTEGER;
        this.ApiKey = apiKey;
        this.EndPoint = endPoint;
    }
    async GetResponse(method, params, id) {
        console.assert(this.ApiKey.length > 0);
        if (!params.apiKey) {
            params.apiKey = this.ApiKey;
        }
        let body = new JsonRPCRequest(RandomMethods[method], params, id);
        let bodyString = JSON.stringify(body);
        let request = {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: bodyString
        };
        let response = await fetch(this.EndPoint, request);
        let result = (await response.json());
        if (result.result != undefined) {
            this.BitsLeft = result.result.bitsLeft;
            this.BitsUsed = result.result.bitsUsed;
            this.RequestsLeft = result.result.requestsLeft;
            return result.result.random;
        }
        return Promise.reject(result.error);
    }
    GenerateIntegers(parameters, id = 0) {
        return this.GetResponse(RandomMethods.generateIntegers, parameters, id);
    }
    GenerateDecimals(parameters, id = 0) {
        return this.GetResponse(RandomMethods.generateDecimalFractions, parameters, id);
    }
}
var RandomMethods;
(function (RandomMethods) {
    RandomMethods[RandomMethods["generateIntegers"] = 0] = "generateIntegers";
    RandomMethods[RandomMethods["generateIntegerSequences"] = 1] = "generateIntegerSequences";
    RandomMethods[RandomMethods["generateDecimalFractions"] = 2] = "generateDecimalFractions";
    RandomMethods[RandomMethods["generateGaussians"] = 3] = "generateGaussians";
    RandomMethods[RandomMethods["generateStrings"] = 4] = "generateStrings";
    RandomMethods[RandomMethods["generateUUIDs"] = 5] = "generateUUIDs";
    RandomMethods[RandomMethods["generateBlobs"] = 6] = "generateBlobs";
    RandomMethods[RandomMethods["getUsage"] = 7] = "getUsage";
    RandomMethods[RandomMethods["generateSignedIntegers"] = 8] = "generateSignedIntegers";
    RandomMethods[RandomMethods["generateSignedIntegerSequences"] = 9] = "generateSignedIntegerSequences";
    RandomMethods[RandomMethods["generateSignedDecimalFractions"] = 10] = "generateSignedDecimalFractions";
    RandomMethods[RandomMethods["generateSignedGaussians"] = 11] = "generateSignedGaussians";
    RandomMethods[RandomMethods["generateSignedStrings"] = 12] = "generateSignedStrings";
    RandomMethods[RandomMethods["generateSignedUUIDs"] = 13] = "generateSignedUUIDs";
    RandomMethods[RandomMethods["generateSignedBlobs"] = 14] = "generateSignedBlobs";
    RandomMethods[RandomMethods["verifySignature"] = 15] = "verifySignature";
    RandomMethods[RandomMethods["getResult"] = 16] = "getResult";
})(RandomMethods || (RandomMethods = {}));
Window["RandomAPI"] = RandomAPI;
//# sourceMappingURL=RandomAPI.js.map