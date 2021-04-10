"use strict";
var https = require('https');
var url = require('url');
var makeRpcRequest = function (options) {
    return new Promise(function (resolve, reject) {
        var postData = JSON.stringify({
            jsonrpc: '2.0',
            method: options.method,
            params: options.params,
            id: options.id || 1
        });
        var endpoint = options.endpoint;
        var requestParams = {
            protocol: endpoint.protocol,
            hostname: endpoint.hostname,
            port: endpoint.port || 443,
            path: endpoint.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData, 'utf8')
            }
        };
        var req = https.request(requestParams, function (res) {
            res.setEncoding('utf8');
            var responseBody = '';
            res.on('data', function (chunk) {
                responseBody += chunk;
            });
            res.on('end', function () {
                try {
                    responseBody = JSON.parse(responseBody);
                    resolve(responseBody);
                }
                catch (e) {
                    reject(new Error('Received invalid JSON'));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
};
class RandomOrg {
    constructor(apiKey, endPoint = "https://api.random.org/json-rpc/4/invoke") {
        this.GenerateIntegers = this.CreateInvocation("generateIntegers");
        this.GenerateIntegerSequences = this.CreateInvocation("generateIntegerSequences");
        this.GenerateDecimalFractions = this.CreateInvocation("generateDecimalFractions");
        this.GenerateGaussians = this.CreateInvocation("generateGaussians");
        this.GenerateStrings = this.CreateInvocation("generateStrings");
        this.GenerateUUIDs = this.CreateInvocation("generateUUIDs");
        this.GenerateBlobs = this.CreateInvocation("generateBlobs");
        this.GetUsage = this.CreateInvocation("getUsage");
        this.GenerateSignedIntegers = this.CreateInvocation("generateSignedIntegers");
        this.GenerateSignedIntegerSequences = this.CreateInvocation("generateSignedIntegerSequences");
        this.GenerateSignedDecimalFractions = this.CreateInvocation("generateSignedDecimalFractions");
        this.GenerateSignedGaussians = this.CreateInvocation("generateSignedGaussians");
        this.GenerateSignedStrings = this.CreateInvocation("generateSignedStrings");
        this.GenerateSignedUUIDs = this.CreateInvocation("generateSignedUUIDs");
        this.GenerateSignedBlobs = this.CreateInvocation("generateSignedBlobs");
        this.VerifySignature = this.CreateInvocation("verifySignature");
        this.GetResult = this.CreateInvocation("getResult");
        this.ApiKey = apiKey;
        this.endPoint = url.parse(endPoint);
    }
    EnrichParams(method, params) {
        if (method === 'verifySignature') {
            return params;
        }
        var requestParams = { apiKey: this.ApiKey };
        Object.keys(params || {}).forEach(function (property) {
            requestParams[property] = params[property];
        });
        return requestParams;
    }
    CreateInvocation(methodName) {
        return (params) => {
            var requestOpts = {
                endpoint: this.endPoint,
                method: methodName,
                params: this.EnrichParams(methodName, params)
            };
            return this.MakeRpcRequest(requestOpts).then((response) => {
                if (response.error) {
                    var error = new Error(response.error.message);
                    error.code = response.error.code;
                    throw error;
                }
                else {
                    return response.result;
                }
            });
        };
    }
}
Hooks.once('init', () => {
    console.debug(`Init`);
    TrueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
    CONFIG.Dice.randomUniform = TrueRNG.GetRandomNumber;
    game.settings.register("TrueRNG", "APIKEY", {
        name: "Random.org API Key",
        hint: "Put your developer key from https://api.random.org/dashboard here",
        scope: "world",
        config: true,
        type: String,
        default: "",
        onChange: value => {
            console.log(`New API KEY: ${value}`);
            TrueRNG.UpdateAPIKey(value);
        }
    });
});
class TrueRNG {
    static UpdateAPIKey(key) {
        console.debug(`UpdateAPIKey`);
        TrueRNG.RandomGenerator = new RandomOrg(key);
        TrueRNG.UpdateRandomNumbers();
    }
    static UpdateRandomNumbers() {
        console.debug(`UpdateRandomNumbers`);
        TrueRNG.RandomGenerator.generateIntegers({ min: 1, max: 99, n: 2 }).then((response) => {
            console.debug(`Got new random numbers`, response);
            TrueRNG.RandomNumbers.concat(response.random.data);
        });
    }
    static GetRandomNumber() {
        console.debug(`GetRandomNumber`);
        if (!TrueRNG.RandomGenerator.ApiKey) {
            console.debug(`\tBad API Key`);
            return TrueRNG.OriginalRandomFunction();
        }
        if (!TrueRNG.RandomNumbers.length) {
            console.debug(`\tNo Random Numbers`);
            TrueRNG.UpdateRandomNumbers();
            return TrueRNG.OriginalRandomFunction();
        }
        console.debug(`\tSuccess`);
        let ms = new Date().getTime();
        let index = ms % TrueRNG.RandomNumbers.length;
        let rng = TrueRNG.RandomNumbers[index];
        TrueRNG.RandomNumbers.splice(index, 1);
        console.debug(`\tReturning ${rng}`, rng, index, ms);
        return rng;
    }
}
TrueRNG.RandomNumbers = [];
//# sourceMappingURL=kidfearless.foundry.rng.js.map