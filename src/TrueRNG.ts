import { RandomAPI } from "./RandomAPI.js";

declare var Hooks;
declare var game;
declare var CONFIG;


Hooks.once('init', () =>
{
	console.log(`Init`);

	// cache the original random func, and overwrite it.
	TrueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
	CONFIG.Dice.randomUniform = TrueRNG.GetRandomNumber;
	
	let params = 
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
	};

	game.settings.register("TrueRNG", "APIKEY", params);

	let currentKey = game.settings.get("TrueRNG", "APIKEY");
	if(currentKey && currentKey.length)
	{
		TrueRNG.UpdateAPIKey(currentKey);
	}


});

class TrueRNG
{
	static RandomNumbers: Number[] = [];
	static RandomGenerator: RandomAPI;

	public static OriginalRandomFunction: Function;
	static AwaitingResponse: boolean;


	public static UpdateAPIKey(key: string)
	{
		console.log(`UpdateAPIKey`);

		TrueRNG.RandomGenerator = new RandomAPI(key);
		TrueRNG.UpdateRandomNumbers();
	}

	public static UpdateRandomNumbers()
	{
		console.log(`UpdateRandomNumbers`);

		// don't do multiple api calls at once
		if (TrueRNG.AwaitingResponse)
		{
			console.log(`\tAlready awaiting a response`);
			return;
		}

		TrueRNG.AwaitingResponse = true;
		TrueRNG.RandomGenerator.GenerateDecimals({ decimalPlaces: 3, n: 20 })
		.then((response) =>
		{
			console.log(`\tGot new random numbers`, response);
			TrueRNG.RandomNumbers = TrueRNG.RandomNumbers.concat(response.data);
		})
		.catch((reason) =>
		{
			console.log(`\tCaught exception ${reason}`);
		})
		.finally(() => 
		{
			console.log(`\tResetting awaiting response property`);
			TrueRNG.AwaitingResponse = false;
		});

	}
	public static GetRandomNumber()
	{
		console.log(`GetRandomNumber`);

		if (!TrueRNG.RandomGenerator || !TrueRNG.RandomGenerator.ApiKey)
		{
			console.log(`\tBad API Key`);

			return TrueRNG.OriginalRandomFunction();
		}

		if (TrueRNG.RandomNumbers.length == 0)
		{
			console.log(`\tNo Random Numbers`);

			if (!TrueRNG.AwaitingResponse)
			{
				TrueRNG.UpdateRandomNumbers();
			}

			return TrueRNG.OriginalRandomFunction();
		}

		console.log(`\tSuccess`);


		if (TrueRNG.RandomNumbers.length <= 10)
		{
			TrueRNG.UpdateRandomNumbers();
		}


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

		console.log(`\tReturning ${rng}`, rng, index, ms);

		// return the item
		return rng;
	}
}