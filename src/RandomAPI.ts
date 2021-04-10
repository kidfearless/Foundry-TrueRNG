import { IGenerateIntegers, IKeyed, IRandomData, IRandomDecimalData, IGenerateDecimalFractions } from './interfaces.js';
import { JsonRPCRequest } from './JsonRPC.js';
import { JsonRPCResponse } from './JsonRPC.js';
export class RandomAPI
{
	ApiKey: string = "https://api.random.org/json-rpc/4/invoke";
	EndPoint: string;
	BitsLeft: number = Number.MAX_SAFE_INTEGER;
	BitsUsed: number = 0;
	RequestsLeft: number = Number.MAX_SAFE_INTEGER;

	/**
	 * Creates an instance of RandomAPI with the given random.org api key.
	 * @param {string} apiKey
	 * @memberof RandomAPI
	 */
	constructor(apiKey: string);
	/**
	 * Creates an instance of RandomAPI with the given random.org api key and end point.
	 * @param {string} apiKey
	 * @param {string} [endPoint="https://api.random.org/json-rpc/4/invoke"]
	 * @memberof RandomAPI
	 */
	constructor(apiKey: string, endPoint: string = "https://api.random.org/json-rpc/4/invoke")
	{
		this.ApiKey = apiKey;
		this.EndPoint = endPoint;
	}

	// simplifies api calls using the fetch function
	private async GetResponse<T>(method: RandomMethods, params: IKeyed, id: any): Promise<T>
	{
		// ensure we have an api key
		console.assert(this.ApiKey.length > 0);

		// inject our key into the data
		if (!params.apiKey)
		{
			params.apiKey = this.ApiKey;
		}

		// Generate the body that random.org is expecting
		let body = new JsonRPCRequest(RandomMethods[method], params, id);
		let bodyString = JSON.stringify(body);

		// random.org is expecting a post request with a content type of json
		let request: RequestInit =
		{
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
		let result = (await response.json()) as JsonRPCResponse<T>;

		
		// return the object if it's valid
		if (result.result != undefined)
		{
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
	public GenerateIntegers(parameters: IGenerateIntegers, id: any = 0): Promise<IRandomData>
	{
		return this.GetResponse<IRandomData>(RandomMethods.generateIntegers, parameters, id);
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
	public GenerateDecimals(parameters: IGenerateDecimalFractions, id:any = 0): Promise<IRandomDecimalData>
	{
		return this.GetResponse<IRandomDecimalData>(RandomMethods.generateDecimalFractions, parameters, id);
	}


}

enum RandomMethods
{
	generateIntegers,
	generateIntegerSequences,
	generateDecimalFractions,
	generateGaussians,
	generateStrings,
	generateUUIDs,
	generateBlobs,
	getUsage,
	generateSignedIntegers,
	generateSignedIntegerSequences,
	generateSignedDecimalFractions,
	generateSignedGaussians,
	generateSignedStrings,
	generateSignedUUIDs,
	generateSignedBlobs,
	verifySignature,
	getResult
}

Window["RandomAPI"] = RandomAPI;