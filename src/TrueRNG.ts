import { RandomAPI } from "./RandomAPI.js";

declare var Hooks;
declare var game;
declare var CONFIG;


Hooks.once('init', () =>
{
	// console.log(`Init`);

	// cache the original random func, and overwrite it.
	// WARNING: CONFIG.Dice.randomUniform is a client sided function.
	// So players can potentially abuse this.
	TrueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
	CONFIG.Dice.randomUniform = TrueRNG.GetRandomNumber;
	
	// #region api key
	let params:any = 
	{
		name: "Random.org API Key",
		hint: "Put your developer key from https://api.random.org/dashboard here",
		scope: "world",      // This specifies a world-level setting
		config: true,        // This specifies that the setting appears in the configuration view
		type: String,
		default: "",         // The default value for the setting
		onChange: value => 
		{
			// console.log(`New API KEY: ${value}`);
			TrueRNG.UpdateAPIKey(value);
		}
	};
	game.settings.register("TrueRNG", "APIKEY", params);
	// #endregion
	// #region max cached numbers
	params = 
	{
		name: "Max Cached Numbers",
		hint: "Number of random numbers to pull in per client. Keep this low if you reload your modules a lot. Keep it high if you tend to roll a lot of dice at once",
		scope: "world",      // This specifies a world-level setting
		config: true,        // This specifies that the setting appears in the configuration view
		type: Number,
		range: {             // If range is specified, the resulting setting will be a range slider
			min: 10,
			max: 200,
			step: 1
		},
		default: 50,         // The default value for the setting
		onChange: value => 
		{
			// console.log(`New Max Cached Numbers: ${value}`);
			TrueRNG.MaxCachedNumbers = parseInt(value);
		}
	};

	game.settings.register("TrueRNG", "MAXCACHEDNUMBERS", params);
	// #endregion

	// #region Update Point
	params = 
	{
		name: "Update Point",
		hint: "Grab more values when the number of cached dice rolls goes below this percentage of the max dice number.",
		scope: "world",      // This specifies a world-level setting
		config: true,        // This specifies that the setting appears in the configuration view
		type: Number,
		range: {             // If range is specified, the resulting setting will be a range slider
			min: 1,
			max: 100,
			step: 1
		},
		default: 50,         // The default value for the setting
		onChange: value => 
		{
			// console.log(`New Update Point: ${value}`);
			TrueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;

		}
	};

	game.settings.register("TrueRNG", "UPDATEPOINT", params);
	// #endregion

	let maxCached = game.settings.get("TrueRNG", "MAXCACHEDNUMBERS");
	TrueRNG.MaxCachedNumbers = parseInt(maxCached);

	let updatePoint = game.settings.get("TrueRNG", "UPDATEPOINT");
	TrueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;


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
	static MaxCachedNumbers: number;
	static UpdatePoint: number;
	static HasAlerted: boolean = false;


	public static UpdateAPIKey(key: string)
	{
		// console.log(`UpdateAPIKey`);

		TrueRNG.RandomGenerator = new RandomAPI(key);
		TrueRNG.UpdateRandomNumbers();
	}

	public static UpdateRandomNumbers()
	{
		// console.log(`UpdateRandomNumbers`);

		// don't do multiple api calls at once
		if (TrueRNG.AwaitingResponse)
		{
			// console.log(`\tAlready awaiting a response`);
			return;
		}

		TrueRNG.AwaitingResponse = true;
		TrueRNG.RandomGenerator.GenerateDecimals({ decimalPlaces: 5, n: TrueRNG.MaxCachedNumbers })
		.then((response) =>
		{
			// console.log(`\tGot new random numbers`, response);
			TrueRNG.RandomNumbers = TrueRNG.RandomNumbers.concat(response.data);
		})
		.catch((reason) =>
		{
			// console.log(`\tCaught exception ${reason}`, reason);
			// console.trace();
		})
		.finally(() => 
		{
			// console.log(`\tResetting awaiting response property`);
			TrueRNG.AwaitingResponse = false;
		});

	}
	public static GetRandomNumber()
	{
		// console.log(`GetRandomNumber`);

		if (!TrueRNG.RandomGenerator || !TrueRNG.RandomGenerator.ApiKey)
		{
			if(!TrueRNG.HasAlerted)
			{
				TrueRNG.HasAlerted = true;
				// @ts-ignore
				let d:any = new Dialog({
					title: "WARNING MISSING API KEY",
					content: "You must set an api key in Module Settings for TrueRNG to function.",
					buttons:
					{
						ok:
						{
							label: "Ok",
						}
					},
					default: "ok",
				});
				d.render(true);
			}

			// console.log(`\tBad API Key`);

			return TrueRNG.OriginalRandomFunction();
		}

		if(!TrueRNG.RandomNumbers.length)
		{
			// console.log(`\tNo Random Numbers`);
			if (!TrueRNG.AwaitingResponse)
			{
				TrueRNG.UpdateRandomNumbers();
			}

			return TrueRNG.OriginalRandomFunction();
		}

		// console.log(`max: ${TrueRNG.MaxCachedNumbers} update: ${TrueRNG.UpdatePoint} val: ${TrueRNG.RandomNumbers.length / TrueRNG.MaxCachedNumbers}`);

		if ((TrueRNG.RandomNumbers.length / TrueRNG.MaxCachedNumbers) < TrueRNG.UpdatePoint)
		{
			// console.log(`\tLimited Random Numbers Available`);

			if (!TrueRNG.AwaitingResponse)
			{
				TrueRNG.UpdateRandomNumbers();
			}
		}

		// console.log(`\tSuccess`);


		if (TrueRNG.RandomNumbers.length <= 10)
		{
			TrueRNG.UpdateRandomNumbers();
		}


		// I don't like the idea that by retrieving all the random numbers at the start that our rolls are predetermined.
		// So the number I grab from the array is based off the current time. 
		// That way every millisecond that passes means that you are getting a different number.
		// This makes it so that the numbers are both random and are not predetermined.

		// get the current time in ms
		let ms = new Date().getTime();
		// find an index from that timestamp
		let index = ms % TrueRNG.RandomNumbers.length;
		// get a copy of the number to return later
		let rng = TrueRNG.RandomNumbers[index];
		// remove that item from the array
		TrueRNG.RandomNumbers.splice(index, 1);

		// console.log(`\tReturning ${rng}`, rng, index, ms);

		// return the item
		return rng;
	}
}