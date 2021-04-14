import { Debug } from "./Debug.js";
import { RandomAPI } from "./RandomAPI.js";
import { Ref } from './Types.js';
export class TrueRNG {
    constructor() {
        /**
         * An array of cached floating point random numbers that is pulled from for the RNG functions.
         *
         * @type {number[]}
         * @memberof TrueRNG
         */
        this.RandomNumbers = [];
        /**
         * An instance of the RandomAPI class. All random.org API calls go through this property.
         *
         * @type {(RandomAPI | null)}
         * @memberof TrueRNG
         */
        this.RandomGenerator = null;
        /**
         * A copy of Foundry's RNG function before we overwrote it. This is used as a fallback for when we run out of random numbers somehow.
         * To prevent having to check for null it's default value is Math.random.
         *
         * @default Math.random
         * @type {RNGFunction}
         * @memberof TrueRNG
         */
        this.OriginalRandomFunction = Math.random;
        /**
         * Function to hold a pre event handler. This is called after the state of the module has been validated but before TrueRNG.PopRandomNumber has been called.
         * Use this to run your own rng functions instead of TrueRNG's.
         *
         * @type {(PreRNGEvent | null)}
         * @memberof TrueRNG
         */
        this.PreRNGEventHandler = null;
        /**
         * Function to hold a post event handler. This is called after a random number has been generated but before that number has been returned.
         * Use this to tweak the generated numbers before being returned to the user.
         *
         * @type {(PostRNGEvent | null)}
         * @memberof TrueRNG
         */
        this.PostRNGEventHandler = null;
        this.AwaitingResponse = false;
        this.MaxCachedNumbers = 50;
        this.UpdatePoint = 0.5;
        this.HasAlerted = false;
        this.Enabled = true;
        this.LastRandomNumber = Math.random();
    }
    /**
     * Create a new RandomAPI instance with the given key, and pull in new random numbers.
     *
     * @param {string} key random.org api key
     * @noreturn
     * @memberof TrueRNG
     */
    UpdateAPIKey(key) {
        // Debug.Group(`UpdateAPIKey`);
        this.RandomGenerator = new RandomAPI(key);
        this.UpdateRandomNumbers();
        // Debug.GroupEnd();
    }
    /**
     * Pulls in new random numbers from random.org if we are enabled and not waiting for a response currently.
     *
     * @noreturn
     * @memberof TrueRNG
     */
    UpdateRandomNumbers() {
        // Debug.Group(`UpdateRandomNumbers`);
        if (!this.Enabled) {
            Debug.WriteLine(`Module Disabled...Returning early`);
            return;
        }
        // don't do multiple api calls at once
        if (this.AwaitingResponse) {
            Debug.WriteLine(`Already awaiting a response`);
            return;
        }
        this.AwaitingResponse = true;
        this.RandomGenerator.GenerateDecimals({ decimalPlaces: 5, n: this.MaxCachedNumbers })
            .then((response) => {
            Debug.WriteLine(`Got new random numbers`, response);
            this.RandomNumbers = this.RandomNumbers.concat(response.data);
        })
            .catch((reason) => {
            Debug.WriteLine(`Caught exception ${reason}`, reason);
        })
            .finally(() => {
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
    GetRandomNumber() {
        // Debug.Group(`GetRandomNumber`);
        if (!this.Enabled) {
            Debug.WriteLine(`TrueRNG disabled, returning original function.`);
            // Debug.GroupEnd();
            return this.OriginalRandomFunction();
        }
        if (!this.RandomGenerator || !this.RandomGenerator.ApiKey) {
            if (!this.HasAlerted) {
                this.HasAlerted = true;
                // @ts-ignore
                let d = new Dialog({
                    title: "WARNING MISSING API KEY",
                    content: "You must set an api key in Module Settings for trueRNG to function.",
                    buttons: {
                        ok: {
                            label: "Ok",
                        }
                    },
                    default: "ok",
                });
                d.render(true);
            }
            Debug.WriteLine(`Bad API Key`);
            // Debug.GroupEnd();
            return this.OriginalRandomFunction();
        }
        if (!this.RandomNumbers.length) {
            Debug.WriteLine(`No Random Numbers`);
            this.UpdateRandomNumbers();
            // Debug.GroupEnd();
            return this.OriginalRandomFunction();
        }
        let rngFuncReference = new Ref(this.PopRandomNumber);
        if (this.PreRNGEventHandler) {
            // Debug.Group(`Pre Event Handler`);
            if (this.PreRNGEventHandler(this, rngFuncReference)) {
                rngFuncReference.Reference = this.OriginalRandomFunction;
            }
            // Debug.GroupEnd();
        }
        Debug.WriteLine(`max: ${this.MaxCachedNumbers} update: ${this.UpdatePoint} val: ${this.RandomNumbers.length / this.MaxCachedNumbers}`);
        if ((this.RandomNumbers.length / this.MaxCachedNumbers) < this.UpdatePoint) {
            Debug.WriteLine(`Limited Random Numbers Available`);
            this.UpdateRandomNumbers();
        }
        Debug.WriteLine(`Success`);
        let randomNumber = rngFuncReference.Reference();
        let randomNumberRef = new Ref(randomNumber);
        if (this.PostRNGEventHandler) {
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
    PopRandomNumber() {
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
Hooks.once('init', () => {
    // Debug.Group(`Init Callback`);
    // cache the original random func, and overwrite it.
    // WARNING: CONFIG.Dice.randomUniform is a client sided function.
    // So players can potentially abuse this.
    trueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
    CONFIG.Dice.randomUniform = trueRNG.GetRandomNumber;
    // #region api key
    let params = {
        name: "Random.org API Key",
        hint: "Put your developer key from https://api.random.org/dashboard here",
        scope: "world",
        config: true,
        type: String,
        default: "",
        onChange: value => {
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
            scope: "world",
            config: true,
            type: Number,
            range: {
                min: 10,
                max: 200,
                step: 1
            },
            default: 50,
            onChange: (value) => {
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
            scope: "world",
            config: true,
            type: Number,
            range: {
                min: 1,
                max: 100,
                step: 1
            },
            default: 50,
            onChange: (value) => {
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
            scope: "world",
            config: true,
            type: Boolean,
            onChange: (value) => {
                Debug.WriteLine(`New Debug Mode: ${value}`);
            },
            default: true // The default value for the setting
        };
    game.settings.register("trueRNG", "DEBUG", params);
    // #endregion
    // #region Enabled Setting
    params =
        {
            name: "Enabled",
            hint: "Enables/Disables the module",
            scope: "world",
            config: true,
            type: Boolean,
            onchange: (value) => {
                Debug.WriteLine(`New Enabled/Disabled Setting: ${value}`);
                trueRNG.Enabled = value;
            },
            default: true // The default value for the setting
        };
    game.settings.register("trueRNG", "ENABLED", params);
    // #endregion
    let maxCached = game.settings.get("trueRNG", "MAXCACHEDNUMBERS");
    trueRNG.MaxCachedNumbers = parseInt(maxCached);
    let updatePoint = game.settings.get("trueRNG", "UPDATEPOINT");
    trueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;
    let currentKey = game.settings.get("trueRNG", "APIKEY");
    if (currentKey && currentKey.length) {
        trueRNG.UpdateAPIKey(currentKey);
    }
    // Debug.GroupEnd();
});
//# sourceMappingURL=TrueRNG.js.map