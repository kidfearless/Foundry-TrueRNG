var https = require('https');
var url = require('url');

//#region RPC Requests
// https://github.com/willfrew/node-random-org
/**
 * @type {Object} RPCOptions
 * @property {String}  method   - RPC Method to invoke
 * @property {Object}  params   - Parameters to invoke the `method` with.
 * @property {URL}     endpoint - A parsed URL object (from `url` module) to send the request to.
 * @property {Integer} [id]     - Optional. Request id.
 */

/**
 * Sends a JSONRPC v2.0 request using the provided options.
 * @param  {RPCOptions}   options   Request options
 * @return {Promise}                A Promise for the result of the request.
 */
var makeRpcRequest = function (options)
{
	return new Promise(function (resolve, reject)
	{
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
		var req = https.request(requestParams, function (res)
		{
			res.setEncoding('utf8');
			var responseBody = '';
			res.on('data', function (chunk)
			{
				responseBody += chunk;
			});
			res.on('end', function ()
			{
				try
				{
					responseBody = JSON.parse(responseBody);
					resolve(responseBody);
				} catch (e)
				{
					reject(new Error('Received invalid JSON'));
				}
			});
		});
		req.on('error', reject);
		req.write(postData);
		req.end();
	});
};

//#endregion

//#region RandomOrg
// https://github.com/willfrew/node-random-org
class RandomOrg
{
	ApiKey:string;
	endPoint:string;
	MakeRpcRequest;

	EnrichParams(method:string, params: Object)
	{
		if (method === 'verifySignature')
		{
			/* The verifySignature method requires no api key (so that anyone
			* can verify the authenticity of some response). */
			return params;
		}

		var requestParams = { apiKey: this.ApiKey };
		Object.keys(params || {}).forEach(function (property)
		{
			requestParams[property] = params[property];
		});
		return requestParams;
	}

	constructor(apiKey:string, endPoint:string = "https://api.random.org/json-rpc/4/invoke")
	{
		this.ApiKey = apiKey;
		this.endPoint = url.parse(endPoint);
	}

	CreateInvocation(methodName:string)
	{
		return (params: Object) =>
		{
			var requestOpts = 
			{
				endpoint: this.endPoint,
				method: methodName,
				params: this.EnrichParams(methodName, params)
			};
			return this.MakeRpcRequest(requestOpts).then((response) =>
			{
				if (response.error)
				{
					var error = new Error(response.error.message);
					// @ts-ignore
					error.code = response.error.code;
					throw error;
				}
				else
				{
					return response.result;
				}
			});
		};
	}
	
	// Basic api methods
	GenerateIntegers = this.CreateInvocation("generateIntegers");
	GenerateIntegerSequences = this.CreateInvocation("generateIntegerSequences");
	GenerateDecimalFractions = this.CreateInvocation("generateDecimalFractions");
	GenerateGaussians = this.CreateInvocation("generateGaussians");
	GenerateStrings = this.CreateInvocation("generateStrings");
	GenerateUUIDs = this.CreateInvocation("generateUUIDs");
	GenerateBlobs = this.CreateInvocation("generateBlobs");
	GetUsage = this.CreateInvocation("getUsage");
	// Signed api methods
	GenerateSignedIntegers = this.CreateInvocation("generateSignedIntegers");
	GenerateSignedIntegerSequences = this.CreateInvocation("generateSignedIntegerSequences");
	GenerateSignedDecimalFractions = this.CreateInvocation("generateSignedDecimalFractions");
	GenerateSignedGaussians = this.CreateInvocation("generateSignedGaussians");
	GenerateSignedStrings = this.CreateInvocation("generateSignedStrings");
	GenerateSignedUUIDs = this.CreateInvocation("generateSignedUUIDs");
	GenerateSignedBlobs = this.CreateInvocation("generateSignedBlobs");
	VerifySignature = this.CreateInvocation("verifySignature");
	GetResult = this.CreateInvocation("getResult");
}


//#endregion


declare var Hooks;
declare var game;
declare var CONFIG;


Hooks.once('init', () =>
{
	console.debug(`Init`);

	// cache the original random func, and overwrite it.
	TrueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
	CONFIG.Dice.randomUniform = TrueRNG.GetRandomNumber;

	game.settings.register("TrueRNG", "APIKEY", 
	{
		name: "Random.org API Key",
		hint: "Put your developer key from https://api.random.org/dashboard here",
		scope: "world",      // This specifies a world-level setting
		config: true,        // This specifies that the setting appears in the configuration view
		type: String,
		default: "",         // The default value for the setting
		onChange: value => 
		{
			console.log(`New API KEY: ${value}`);
			TrueRNG.UpdateAPIKey(value);
		}
	});
	
	
});

type response = 
{
	random: 
	{
	  /* Your requested bits, Sir. */
	  data: Array<number>,
		// Array containing your requested random numbers or strings.
	  completionTime: String
		// The time that request was completed, in ISO 8601 format (parsable with new Date(isoString)).
	},
	bitsUsed: Number,
	  // The number of random bits generated in this request.
	bitsLeft: Number,
	  // An estimate of the number of remaining bits you can request.
	requestsLeft: Number,
	  // An estimate of the number of remaining api calls you can make.
	advisoryDelay: Number
	  // The recommended number of milliseconds you should wait before making another request.
}

class TrueRNG
{
	static RandomNumbers: Number[] = [];
	static RandomGenerator: RandomOrg;
	
	public static OriginalRandomFunction: Function;


	public static UpdateAPIKey(key:string)
	{
		console.debug(`UpdateAPIKey`);

		TrueRNG.RandomGenerator = new RandomOrg(key);
		TrueRNG.UpdateRandomNumbers();
	}

	public static UpdateRandomNumbers()
	{
		console.debug(`UpdateRandomNumbers`);

		// @ts-ignore
		TrueRNG.RandomGenerator.generateIntegers({ min: 1, max: 99, n: 2 }).then((response: response) =>
		{
			console.debug(`Got new random numbers`, response);
			TrueRNG.RandomNumbers.concat(response.random.data);
		});
	}
	public static GetRandomNumber()
	{
		console.debug(`GetRandomNumber`);

		if(!TrueRNG.RandomGenerator.ApiKey)
		{
			console.debug(`\tBad API Key`);

			return TrueRNG.OriginalRandomFunction();
		}

		if(!TrueRNG.RandomNumbers.length)
		{
			console.debug(`\tNo Random Numbers`);

			TrueRNG.UpdateRandomNumbers();
			return TrueRNG.OriginalRandomFunction();
		}
		console.debug(`\tSuccess`);


		// I don't like the idea that by retrieving all the random numbers at the start that our rolls are predetermined.
		// So the number I grab from the array is based off the current time. 
		// That way every millisecond that passes means that you are getting a different number.
		// So depending on how the game goes you would be getting different numbers than you would if I didn't do this.

		// get the current time in ms
		let ms = new Date().getTime();
		// find an index from that timestamp
		let index = ms % TrueRNG.RandomNumbers.length;
		// get a copy of the number to return later
		let rng = TrueRNG.RandomNumbers[index];
		// remove that item from the array
		TrueRNG.RandomNumbers.splice(index, 1);

		console.debug(`\tReturning ${rng}`, rng, index, ms);

		// return the item
		return rng;
	}
}