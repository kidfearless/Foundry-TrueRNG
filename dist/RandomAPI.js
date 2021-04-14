import { JsonRPCRequest } from './JsonRPC.js';
export class RandomAPI {
    /**
     * Creates an instance of RandomAPI with the given random.org api key and end point.
     * @param {string} apiKey
     * @param {string} [endPoint="https://api.random.org/json-rpc/4/invoke"]
     * @memberof RandomAPI
     */
    constructor(apiKey, endPoint = "https://api.random.org/json-rpc/4/invoke") {
        this.BitsLeft = Number.MAX_SAFE_INTEGER;
        this.BitsUsed = 0;
        this.RequestsLeft = Number.MAX_SAFE_INTEGER;
        this.ApiKey = apiKey;
        this.EndPoint = endPoint;
    }
    // simplifies api calls using the fetch function
    async GetResponse(method, params, id) {
        // ensure we have an api key
        console.assert(this.ApiKey.length > 0);
        // inject our key into the data
        if (!params.apiKey) {
            params.apiKey = this.ApiKey;
        }
        // Generate the body that random.org is expecting
        let body = new JsonRPCRequest(RandomMethods[method], params, id);
        let bodyString = JSON.stringify(body);
        // random.org is expecting a post request with a content type of json
        let request = {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: bodyString
        };
        // send the request to the end point and await a response
        let response = await fetch(this.EndPoint, request);
        // read the body of the response as a json object, specifically the JsonRPCResponse object.
        // we don't need to know what T is right now, just whether or not we have a result
        let result = (await response.json());
        // return the object if it's valid
        if (result.result != undefined) {
            this.BitsLeft = result.result.bitsLeft;
            this.BitsUsed = result.result.bitsUsed;
            this.RequestsLeft = result.result.requestsLeft;
            return result.result.random;
        }
        // throw an error if it's not
        return Promise.reject(result.error);
    }
    /**
     * Generate random numbers with the given requirements
     *
     * @param {IGenerateIntegers} parameters specifies the minimum, maximum, and quantity of numbers generated
     * @param {*} [id=0] an optional id to pass to identify the api request
     *
     * @return {Promise<IRandomData>} A promise with the random data within it
     * @memberof RandomAPI
     */
    GenerateIntegers(parameters, id = 0) {
        return this.GetResponse(RandomMethods.generateIntegers, parameters, id);
    }
    /**
     * Generate random numbers between 0 and 1 with the given requirements
     *
     * @param {IGenerateDecimalFractions} parameters specifies the decimal places, and quantity of numbers generated
     * @param {*} [id=0] an optional id to pass to identify the api request
     *
     * @return {Promise<IRandomDecimalData>} A promise with the random data within it
     * @memberof RandomAPI
     */
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