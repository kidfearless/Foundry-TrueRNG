import { Debug } from "./Debug.js";
import { RandomAPI } from "./RandomAPI.js";
Hooks.once('init', () => {
    Debug.Group(`Init Callback`);
    TrueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
    CONFIG.Dice.randomUniform = TrueRNG.GetRandomNumber;
    let params = {
        name: "Random.org API Key",
        hint: "Put your developer key from https://api.random.org/dashboard here",
        scope: "world",
        config: true,
        type: String,
        default: "",
        onChange: value => {
            Debug.WriteLine(`New API KEY: ${value}`);
            TrueRNG.UpdateAPIKey(value);
        }
    };
    game.settings.register("TrueRNG", "APIKEY", params);
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
                TrueRNG.MaxCachedNumbers = value;
            }
        };
    game.settings.register("TrueRNG", "MAXCACHEDNUMBERS", params);
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
                TrueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;
            }
        };
    game.settings.register("TrueRNG", "UPDATEPOINT", params);
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
            default: true
        };
    game.settings.register("TrueRNG", "DEBUG", params);
    params =
        {
            name: "Enabled",
            hint: "Enables/Disables the module",
            scope: "world",
            config: true,
            type: Boolean,
            onchange: (value) => {
                Debug.WriteLine(`New Enabled/Disabled Setting: ${value}`);
                TrueRNG.Enabled = value;
            },
            default: true
        };
    game.settings.register("TrueRNG", "ENABLED", params);
    let maxCached = game.settings.get("TrueRNG", "MAXCACHEDNUMBERS");
    TrueRNG.MaxCachedNumbers = parseInt(maxCached);
    let updatePoint = game.settings.get("TrueRNG", "UPDATEPOINT");
    TrueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;
    let currentKey = game.settings.get("TrueRNG", "APIKEY");
    if (currentKey && currentKey.length) {
        TrueRNG.UpdateAPIKey(currentKey);
    }
    Debug.GroupEnd();
});
class TrueRNG {
    static UpdateAPIKey(key) {
        Debug.Group(`UpdateAPIKey`);
        TrueRNG.RandomGenerator = new RandomAPI(key);
        TrueRNG.UpdateRandomNumbers();
        Debug.GroupEnd();
    }
    static UpdateRandomNumbers() {
        Debug.Group(`UpdateRandomNumbers`);
        if (TrueRNG.AwaitingResponse) {
            Debug.WriteLine(`\tAlready awaiting a response`);
            return;
        }
        TrueRNG.AwaitingResponse = true;
        TrueRNG.RandomGenerator.GenerateDecimals({ decimalPlaces: 5, n: TrueRNG.MaxCachedNumbers })
            .then((response) => {
            Debug.WriteLine(`\tGot new random numbers`, response);
            TrueRNG.RandomNumbers = TrueRNG.RandomNumbers.concat(response.data);
        })
            .catch((reason) => {
            Debug.WriteLine(`\tCaught exception ${reason}`, reason);
        })
            .finally(() => {
            Debug.WriteLine(`\tResetting awaiting response property`);
            TrueRNG.AwaitingResponse = false;
        });
        Debug.GroupEnd();
    }
    static GetRandomNumber() {
        Debug.Group(`GetRandomNumber`);
        if (!TrueRNG.Enabled) {
            Debug.WriteLine(`TrueRNG disabled, returning original function.`);
            Debug.GroupEnd();
            return TrueRNG.OriginalRandomFunction();
        }
        if (!TrueRNG.RandomGenerator || !TrueRNG.RandomGenerator.ApiKey) {
            if (!TrueRNG.HasAlerted) {
                TrueRNG.HasAlerted = true;
                let d = new Dialog({
                    title: "WARNING MISSING API KEY",
                    content: "You must set an api key in Module Settings for TrueRNG to function.",
                    buttons: {
                        ok: {
                            label: "Ok",
                        }
                    },
                    default: "ok",
                });
                d.render(true);
            }
            Debug.WriteLine(`\tBad API Key`);
            Debug.GroupEnd();
            return TrueRNG.OriginalRandomFunction();
        }
        if (!TrueRNG.RandomNumbers.length) {
            Debug.WriteLine(`\tNo Random Numbers`);
            if (!TrueRNG.AwaitingResponse) {
                TrueRNG.UpdateRandomNumbers();
            }
            Debug.GroupEnd();
            return TrueRNG.OriginalRandomFunction();
        }
        Debug.WriteLine(`max: ${TrueRNG.MaxCachedNumbers} update: ${TrueRNG.UpdatePoint} val: ${TrueRNG.RandomNumbers.length / TrueRNG.MaxCachedNumbers}`);
        if ((TrueRNG.RandomNumbers.length / TrueRNG.MaxCachedNumbers) < TrueRNG.UpdatePoint) {
            Debug.WriteLine(`\tLimited Random Numbers Available`);
            if (!TrueRNG.AwaitingResponse) {
                TrueRNG.UpdateRandomNumbers();
            }
        }
        Debug.WriteLine(`\tSuccess`);
        if (TrueRNG.RandomNumbers.length <= 10) {
            TrueRNG.UpdateRandomNumbers();
        }
        let ms = new Date().getTime();
        let index = ms % TrueRNG.RandomNumbers.length;
        let rng = TrueRNG.RandomNumbers[index];
        TrueRNG.RandomNumbers.splice(index, 1);
        Debug.WriteLine(`\tReturning ${rng}`, rng, index, ms);
        Debug.GroupEnd();
        return rng;
    }
}
TrueRNG.RandomNumbers = [];
TrueRNG.HasAlerted = false;
//# sourceMappingURL=TrueRNG.js.map