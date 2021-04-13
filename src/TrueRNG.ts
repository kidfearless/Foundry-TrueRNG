import { Debug } from "./Debug.js";
import { RandomAPI } from "./RandomAPI.js";
import { JsonRPCRequest } from './JsonRPC';
import { PreRNGEvent, PostRNGEvent, RNGFunction, Ref } from './Types.js';

declare var Hooks;
declare var game;
declare var CONFIG;

export class TrueRNG
{
	public RandomNumbers: number[] = [];
	public RandomGenerator: RandomAPI | null = null;
	public AwaitingResponse: boolean;
	public MaxCachedNumbers: number;
	public UpdatePoint: number;
	public HasAlerted: boolean;
	public Enabled: boolean;
	public OriginalRandomFunction: RNGFunction = Math.random;
	public PreRNGEventHandler: PreRNGEvent | null = null;
	public PostRNGEventHandler: PostRNGEvent | null = null;
	public LastRandomNumber: number;

	constructor()
	{
		this.AwaitingResponse = false;
		this.MaxCachedNumbers = 50;
		this.UpdatePoint = 0.5;
		this.HasAlerted = false;
		this.Enabled = true;
		this.LastRandomNumber = Math.random();
	}


	public UpdateAPIKey(key: string): void
	{
		Debug.Group(`UpdateAPIKey`);

		this.RandomGenerator = new RandomAPI(key);
		this.UpdateRandomNumbers();
		Debug.GroupEnd();
	}

	public UpdateRandomNumbers(): void
	{
		Debug.Group(`UpdateRandomNumbers`);

		if (!this.Enabled)
		{
			Debug.WriteLine(`Module Disabled...Returning early`);
			return;
		}

		// don't do multiple api calls at once
		if (this.AwaitingResponse)
		{
			Debug.WriteLine(`Already awaiting a response`);
			return;
		}

		this.AwaitingResponse = true;
		this.RandomGenerator!.GenerateDecimals({ decimalPlaces: 5, n: this.MaxCachedNumbers })
			.then((response) =>
			{
				Debug.WriteLine(`Got new random numbers`, response);
				this.RandomNumbers = this.RandomNumbers.concat(response.data);
			})
			.catch((reason) =>
			{
				Debug.WriteLine(`Caught exception ${reason}`, reason);
			})
			.finally(() => 
			{
				Debug.WriteLine(`Resetting awaiting response property`);
				this.AwaitingResponse = false;
			});

		Debug.GroupEnd();
	}
	public GetRandomNumber(): number
	{
		Debug.Group(`GetRandomNumber`);

		if (!this.Enabled)
		{
			Debug.WriteLine(`TrueRNG disabled, returning original function.`);
			Debug.GroupEnd();
			return this.OriginalRandomFunction!();
		}

		if (!this.RandomGenerator || !this.RandomGenerator.ApiKey)
		{
			if (!this.HasAlerted)
			{
				this.HasAlerted = true;
				// @ts-ignore
				let d: any = new Dialog({
					title: "WARNING MISSING API KEY",
					content: "You must set an api key in Module Settings for trueRNG to function.",
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

			Debug.WriteLine(`Bad API Key`);
			Debug.GroupEnd();

			return this.OriginalRandomFunction!();
		}

		if (!this.RandomNumbers.length)
		{
			Debug.WriteLine(`No Random Numbers`);
			if (!this.AwaitingResponse)
			{
				this.UpdateRandomNumbers();
			}
			Debug.GroupEnd();

			return this.OriginalRandomFunction!();
		}

		let rngFunction = this.PopRandomNumber;
		if(this.PreRNGEventHandler)
		{
			Debug.Group(`Pre Event Handler`);
			let ref = new Ref<RNGFunction>(rngFunction);
			if(this.PreRNGEventHandler(this, ref))
			{
				return this.OriginalRandomFunction();
			}
			rngFunction = ref.Reference;
			Debug.GroupEnd();
		}


		Debug.WriteLine(`max: ${this.MaxCachedNumbers} update: ${this.UpdatePoint} val: ${this.RandomNumbers.length / this.MaxCachedNumbers}`);

		if ((this.RandomNumbers.length / this.MaxCachedNumbers) < this.UpdatePoint)
		{
			Debug.WriteLine(`Limited Random Numbers Available`);

			this.UpdateRandomNumbers();
		}



		Debug.WriteLine(`Success`);

		let rng = new Ref(rngFunction());

		if(this.PostRNGEventHandler)
		{
			this.PostRNGEventHandler(this, rng);
		}

		this.LastRandomNumber = rng.Reference;



		Debug.GroupEnd();
		// return the item
		return this.LastRandomNumber;
	}

	public PopRandomNumber(): number
	{
		Debug.Group(`PopRandomNumber`);
		// I don't like the idea that by retrieving all the random numbers at the start that our rolls are predetermined.
		// So the number I grab from the array is based off the current time. 
		// That way every millisecond that passes means that you are getting a different number.
		// This makes it so that the numbers are both random and are not predetermined.

		// get the current time in ms
		let ms = new Date().getTime();
		// find an index from that timestamp
		let index = ms % this.RandomNumbers.length;
		// get a copy of the number to return later
		let rng = this.RandomNumbers[index];
		// remove that item from the array
		this.RandomNumbers.splice(index, 1);
		Debug.WriteLine(`Returning ${rng}`, rng, index, ms);
		Debug.GroupEnd();
		return rng;
	}
}

var trueRNG = new TrueRNG();
globalThis.TrueRNG = trueRNG;

Hooks.once('init', () =>
{
	Debug.Group(`Init Callback`);

	// cache the original random func, and overwrite it.
	// WARNING: CONFIG.Dice.randomUniform is a client sided function.
	// So players can potentially abuse this.
	trueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
	CONFIG.Dice.randomUniform = trueRNG.GetRandomNumber;

	// #region api key
	let params: any =
	{
		name: "Random.org API Key",
		hint: "Put your developer key from https://api.random.org/dashboard here",
		scope: "world",      // This specifies a world-level setting
		config: true,        // This specifies that the setting appears in the configuration view
		type: String,
		default: "",         // The default value for the setting
		onChange: value => 
		{
			Debug.WriteLine(`New API KEY: ${value}`);
			trueRNG.UpdateAPIKey(value);
		}
	};
	game.settings.register("trueRNG", "APIKEY", params);
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
		onChange: (value: number) => 
		{
			Debug.WriteLine(`New Max Cached Numbers: ${value}`);
			trueRNG.MaxCachedNumbers = value;
		}
	};

	game.settings.register("trueRNG", "MAXCACHEDNUMBERS", params);
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
		onChange: (value: number) => 
		{
			Debug.WriteLine(`New Update Point: ${value}`);
			trueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;
		}
	};

	game.settings.register("trueRNG", "UPDATEPOINT", params);
	// #endregion

	// #region Debug Messages
	params =
	{
		name: "Print Debug Messages",
		hint: "Print debug messages to console",
		scope: "world",      // This specifies a world-level setting
		config: true,        // This specifies that the setting appears in the configuration view
		type: Boolean,
		onChange: (value: boolean) => 
		{
			Debug.WriteLine(`New Debug Mode: ${value}`);
		},
		default: true         // The default value for the setting
	};

	game.settings.register("trueRNG", "DEBUG", params);
	// #endregion

	// #region Enabled Setting
	params =
	{
		name: "Enabled",
		hint: "Enables/Disables the module",
		scope: "world",      // This specifies a world-level setting
		config: true,        // This specifies that the setting appears in the configuration view
		type: Boolean,
		onchange: (value: boolean) =>
		{
			Debug.WriteLine(`New Enabled/Disabled Setting: ${value}`);
			trueRNG.Enabled = value;
		},
		default: true         // The default value for the setting
	};

	game.settings.register("trueRNG", "ENABLED", params);
	// #endregion

	let maxCached = game.settings.get("trueRNG", "MAXCACHEDNUMBERS");
	trueRNG.MaxCachedNumbers = parseInt(maxCached);

	let updatePoint = game.settings.get("trueRNG", "UPDATEPOINT");
	trueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;


	let currentKey = game.settings.get("trueRNG", "APIKEY");
	if (currentKey && currentKey.length)
	{
		trueRNG.UpdateAPIKey(currentKey);
	}
	Debug.GroupEnd();
});
