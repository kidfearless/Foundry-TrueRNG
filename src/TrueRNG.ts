import { Debug } from "./Debug.js";
import { RandomAPI } from "./RandomAPI.js";
import { JsonRPCRequest } from './JsonRPC';
import { PreRNGEvent, PostRNGEvent, RNGFunction, Ref } from './Types.js';
import { LocalStorage } from './BrowserConfig.js';

declare var Hooks;
declare var game;
declare var CONFIG;

export class TrueRNG
{
	/**
	 * An array of cached floating point random numbers that is pulled from for the RNG functions.
	 *
	 * @type {number[]}
	 * @memberof TrueRNG
	 */
	public RandomNumbers: number[] = [];

	/**
	 * An instance of the RandomAPI class. All random.org API calls go through this property.
	 *
	 * @type {(RandomAPI | null)}
	 * @memberof TrueRNG
	 */
	public RandomGenerator: RandomAPI | null = null;

	/**
	 * A temporary variable used to determine if we are awaiting a response from random.org.
	 * Dice rolls happen all at once when you do /r 100d20 so we don't want to make 99 api calls and burn through our quota on a single player.
	 *
	 * @type {boolean}
	 * @memberof TrueRNG
	 */
	public AwaitingResponse: boolean;

	/**
	 * Cached copy of it's game settings counter part. There's no real reason to cache it but here it is.
	 *
	 * @type {number}
	 * @memberof TrueRNG
	 */
	public MaxCachedNumbers: number;

	/**
	 * Cached copy of it's game settings counter part.
	 *
	 * @type {number}
	 * @memberof TrueRNG
	 */
	public UpdatePoint: number;

	/**
	 * Whether or not we've alerted the clients that they haven't entered a valid api key.
	 *
	 * @type {boolean}
	 * @memberof TrueRNG
	 */
	public HasAlerted: boolean;

	/**
	 * Is this module enabled right now. Allows for temporarily disabling the module without reloading the entire application by disabling a module.
	 *
	 * @type {boolean}
	 * @memberof TrueRNG
	 */
	public Enabled: boolean;

	/**
	 * A copy of Foundry's RNG function before we overwrote it. This is used as a fallback for when we run out of random numbers somehow.
	 * To prevent having to check for null it's default value is Math.random.
	 * 
	 * @default Math.random
	 * @type {RNGFunction}
	 * @memberof TrueRNG
	 */
	public OriginalRandomFunction: RNGFunction = Math.random;

	/**
	 * Function to hold a pre event handler. This is called after the state of the module has been validated but before TrueRNG.PopRandomNumber has been called.
	 * Use this to run your own rng functions instead of TrueRNG's.
	 *
	 * @type {(PreRNGEvent | null)}
	 * @memberof TrueRNG
	 */
	public PreRNGEventHandler: PreRNGEvent | null = null;

	/**
	 * Function to hold a post event handler. This is called after a random number has been generated but before that number has been returned.
	 * Use this to tweak the generated numbers before being returned to the user.
	 *
	 * @type {(PostRNGEvent | null)}
	 * @memberof TrueRNG
	 */
	public PostRNGEventHandler: PostRNGEvent | null = null;

	/**
	 * The last number generated. Assigned just before GetRandomNumber returns it's value. It's mostly used for debugging.
	 *
	 * @type {number}
	 * @memberof TrueRNG
	 */
	public LastRandomNumber: number;

	/**
	 * A reference to ON/OFF anchor tag. Always null for regular players, only the GM will have access to it.
	 *
	 * @type {(HTMLAnchorElement | null)}
	 * @memberof TrueRNG
	 */
	public QuickToggleButton: HTMLAnchorElement | null;

	constructor()
	{
		this.AwaitingResponse = false;
		this.MaxCachedNumbers = 50;
		this.UpdatePoint = 0.5;
		this.HasAlerted = false;
		this.Enabled = true;
		this.LastRandomNumber = Math.random();
		this.QuickToggleButton = null;
	}


	/**
	 * Create a new RandomAPI instance with the given key, and pull in new random numbers.
	 *
	 * @param {string} key random.org api key
	 * @noreturn
	 * @memberof TrueRNG
	 */
	public UpdateAPIKey(key: string): void
	{
		// Debug.Group(`UpdateAPIKey`);

		this.RandomGenerator = new RandomAPI(key);
		this.UpdateRandomNumbers();
		// Debug.GroupEnd();
	}

	/**
	 * Generates an anchor tag and a style element for the quick toggle button. Limited only to the GM.
	 *
	 * @param {boolean} enabled Is this setting currently enabled or disabled.
	 * @noreturn
	 * @memberof TrueRNG
	 */
	public GenerateQuickToggleButton(enabled: boolean)
	{
		if (!game.user || !game.user.isGM || this.QuickToggleButton)
		{
			return;
		}

		let classes = document.createElement("style") as HTMLStyleElement;
		classes.innerHTML = `
		.trhidden { display: none; }
		.trvisible { display: initial; }
		.trquickbutton {
			flex: inherit;
			margin: auto auto;
			text-align: center;
			padding-right: 4px;
		}`;

		document.body.appendChild(classes);


		// has to be an anchor for the title property
		let quickToggleButton = document.createElement("a");
		let outerDiv = document.querySelector("#chat-controls");
		let firstChild = document.querySelector("#chat-controls > .chat-control-icon");



		quickToggleButton.id = "TrueRNGQuickToggleButton";
		quickToggleButton.title = "Toggle the TrueRNG module";
		quickToggleButton.classList.add("trquickbutton");

		if (enabled)
		{
			quickToggleButton.classList.add("trvisible");
		}
		else
		{
			quickToggleButton.classList.add("trhidden");
		}

		if (game.settings.get("truerng", "ENABLED"))
		{
			quickToggleButton.innerHTML = "ON";
		}
		else
		{
			quickToggleButton.innerHTML = "OFF";
		}

		quickToggleButton.addEventListener("click", (ev) =>
		{
			if (game.settings.get("truerng", "ENABLED"))
			{
				game.settings.set("truerng", "ENABLED", false);
				quickToggleButton.innerHTML = "OFF";
			}
			else
			{
				game.settings.set("truerng", "ENABLED", true);
				quickToggleButton.innerHTML = "ON";
			}
		});


		outerDiv?.insertBefore(quickToggleButton, firstChild);

		this.QuickToggleButton = quickToggleButton;
	}


	/**
	 * Pulls in new random numbers from random.org if we are enabled and not waiting for a response currently.
	 *
	 * @noreturn
	 * @memberof TrueRNG
	 */
	public UpdateRandomNumbers(): void
	{
		// Debug.Group(`UpdateRandomNumbers`);

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

		// Debug.GroupEnd();
	}


	/**
	 * Returns a random number either from the cached random.org numbers or from Foundry's random function.
	 *
	 * @return {number} A random decimal number between 0.0 and 1.0
	 * @memberof TrueRNG
	 */
	public GetRandomNumber(): number
	{
		// Debug.Group(`GetRandomNumber`);

		if (!this.Enabled)
		{
			Debug.WriteLine(`TrueRNG disabled, returning original function.`);
			// Debug.GroupEnd();
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
			// Debug.GroupEnd();

			return this.OriginalRandomFunction!();
		}

		if (!this.RandomNumbers.length)
		{
			Debug.WriteLine(`No Random Numbers`);

			this.UpdateRandomNumbers();
			// Debug.GroupEnd();

			return this.OriginalRandomFunction!();
		}

		let rngFuncReference = new Ref<RNGFunction>(this.PopRandomNumber.bind(this));


		if (this.PreRNGEventHandler)
		{
			// Debug.Group(`Pre Event Handler`);
			if (this.PreRNGEventHandler(this, rngFuncReference))
			{
				rngFuncReference.Reference = this.OriginalRandomFunction;
			}
			// Debug.GroupEnd();
		}


		Debug.WriteLine(`max: ${this.MaxCachedNumbers} update: ${this.UpdatePoint} val: ${this.RandomNumbers.length / this.MaxCachedNumbers}`);

		if ((this.RandomNumbers.length / this.MaxCachedNumbers) < this.UpdatePoint)
		{
			Debug.WriteLine(`Limited Random Numbers Available`);

			this.UpdateRandomNumbers();
		}

		Debug.WriteLine(`Success`);

		let randomNumber = rngFuncReference.Reference();
		let randomNumberRef = new Ref(randomNumber);

		if (this.PostRNGEventHandler)
		{
			this.PostRNGEventHandler(this, randomNumberRef);
		}

		this.LastRandomNumber = randomNumberRef.Reference;



		// Debug.GroupEnd();
		// return the item
		return this.LastRandomNumber;
	}


	/**
	 * Picks a "random" index from the RandomNumbers array and removes the item from that index from the array and returns it.
	 * Index is determined by the current time in milliseconds modulused by the length of the array.
	 *
	 * @return {number} random number from the cached array of random.org numbers
	 * @exception {OutOfBoundsException} If the RandomNumbers.length property is 0 then this can throw an exception.
	 * @memberof TrueRNG
	 */
	public PopRandomNumber(): number
	{
		// Debug.Group(`PopRandomNumber`);
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
		// Debug.GroupEnd();
		return rng;
	}
}

var trueRNG = new TrueRNG();
// This allows us to access it in a global scope from any module. Though the point at which it's available is indeterminate
globalThis.TrueRNG = trueRNG;

Hooks.once('init', () =>
{
	// Debug.Group(`Init Callback`);

	// cache the original random func, and overwrite it.
	// WARNING: CONFIG.Dice.randomUniform is a client sided function.
	// So players can potentially abuse this.
	trueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
	CONFIG.Dice.randomUniform = trueRNG.GetRandomNumber.bind(trueRNG);

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
	game.settings.register("truerng", "APIKEY", params);
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
			min: 5,
			max: 200,
			step: 1
		},
		default: 10,         // The default value for the setting
		onChange: (value: number) => 
		{
			Debug.WriteLine(`New Max Cached Numbers: ${value}`);
			trueRNG.MaxCachedNumbers = value;
		}
	};

	game.settings.register("truerng", "MAXCACHEDNUMBERS", params);
	// #endregion

	// #region Update Point
	params =
	{
		name: "Update Point",
		hint: "Grab more values when the number of cached dice rolls goes below this percentage of the max dice number.",
		scope: "world",
		config: true,
		type: Number,
		range: {
			min: 1,
			max: 100,
			step: 1
		},
		default: 50,
		onChange: (value: number) => 
		{
			Debug.WriteLine(`New Update Point: ${value}`);
			trueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;
		}
	};

	game.settings.register("truerng", "UPDATEPOINT", params);
	// #endregion

	// #region Debug Messages
	params =
	{
		name: "Print Debug Messages",
		hint: "Print debug messages to console",
		scope: "client",
		config: true,
		type: Boolean,
		onChange: (value: boolean) => 
		{
			Debug.WriteLine(`New Debug Mode: ${value}`);
		},
		default: true
	};

	game.settings.register("truerng", "DEBUG", params);
	// #endregion

	// #region Enabled Setting
	params =
	{
		name: "Enabled",
		hint: "Enables/Disables the module",
		scope: "world",
		config: true,
		type: Boolean,
		onChange: (value: boolean) =>
		{
			Debug.WriteLine(`New Enabled/Disabled Setting: ${value}`);
			trueRNG.Enabled = value;
		},
		default: true
	};

	game.settings.register("truerng", "ENABLED", params);
	trueRNG.Enabled = game.settings.get("truerng", "ENABLED");
	// #endregion

	// #region Show Quick Toggle Button
	params =
	{
		name: "Show Quick Toggle Button",
		hint: "Toggles displaying a button above the dice roll text box that quickly enables or disables the module.",
		scope: "client",
		config: true,
		type: Boolean,
		onChange: (value: boolean) =>
		{
			Debug.WriteLine(`Show Quick Toggle Button: ${value}`);
			if (value)
			{
				trueRNG.QuickToggleButton?.classList.remove("trhidden");
				trueRNG.QuickToggleButton?.classList.add("trvisible");
			}
			else
			{
				trueRNG.QuickToggleButton?.classList.add("trhidden");
				trueRNG.QuickToggleButton?.classList.remove("trvisible");
			}
		},
		default: true
	};

	game.settings.register("truerng", "QUICKTOGGLE", params);
	// #endregion

	let maxCached = game.settings.get("truerng", "MAXCACHEDNUMBERS");
	trueRNG.MaxCachedNumbers = parseInt(maxCached);

	let updatePoint = game.settings.get("truerng", "UPDATEPOINT");
	trueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;


	// try to retrieve the api key from the game settings
	let currentKey = game.settings.get("truerng", "APIKEY");
	// If we find the key, save it in storage and update the TrueRNG's copy of it.
	if (currentKey && currentKey.length)
	{
		LocalStorage.Set("TrueRNG.ApiKey", currentKey);

		trueRNG.UpdateAPIKey(currentKey);
	}
	// otherwise check if we have an 
	else if (LocalStorage.Get("TrueRNG.ApiKey", null))
	{
		let savedKey = LocalStorage.Get<string>("TrueRNG.ApiKey");
		game.settings.set("truerng", "APIKEY", savedKey);

		trueRNG.UpdateAPIKey(savedKey);
	}

	// Debug.GroupEnd();
});

// have to use ready in order for the query selectors to work.
Hooks.once('ready', () =>
{
	let enabled = true;
	try
	{
		// some big brained module maker thinks it's a good idea to call the ready hook before the game is actually ready.
		// so now we add a try catch because of their code.
		enabled = game.settings.get("truerng", "QUICKTOGGLE");
	}
	catch(e){}
	trueRNG.GenerateQuickToggleButton(enabled);
});

