import { RandomAPI } from "./RandomAPI.js";
Hooks.once('init', () => {
    DebugLog(`Init`);
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
            DebugLog(`New API KEY: ${value}`);
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
            onChange: value => {
                DebugLog(`New Max Cached Numbers: ${value}`);
                TrueRNG.MaxCachedNumbers = parseInt(value);
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
            onChange: value => {
                DebugLog(`New Update Point: ${value}`);
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
            default: true
        };
    game.settings.register("TrueRNG", "DEBUG", params);
    let maxCached = game.settings.get("TrueRNG", "MAXCACHEDNUMBERS");
    TrueRNG.MaxCachedNumbers = parseInt(maxCached);
    let updatePoint = game.settings.get("TrueRNG", "UPDATEPOINT");
    TrueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;
    let currentKey = game.settings.get("TrueRNG", "APIKEY");
    if (currentKey && currentKey.length) {
        TrueRNG.UpdateAPIKey(currentKey);
    }
});
class TrueRNG {
    static UpdateAPIKey(key) {
        console.group();
        DebugLog(`UpdateAPIKey`);
        TrueRNG.RandomGenerator = new RandomAPI(key);
        TrueRNG.UpdateRandomNumbers();
    }
    static UpdateRandomNumbers() {
        DebugLog(`UpdateRandomNumbers`);
        if (TrueRNG.AwaitingResponse) {
            DebugLog(`\tAlready awaiting a response`);
            return;
        }
        TrueRNG.AwaitingResponse = true;
        TrueRNG.RandomGenerator.GenerateDecimals({ decimalPlaces: 5, n: TrueRNG.MaxCachedNumbers })
            .then((response) => {
            DebugLog(`\tGot new random numbers`, response);
            TrueRNG.RandomNumbers = TrueRNG.RandomNumbers.concat(response.data);
        })
            .catch((reason) => {
            DebugLog(`\tCaught exception ${reason}`, reason);
        })
            .finally(() => {
            DebugLog(`\tResetting awaiting response property`);
            TrueRNG.AwaitingResponse = false;
        });
    }
    static GetRandomNumber() {
        DebugLog(`GetRandomNumber`);
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
            DebugLog(`\tBad API Key`);
            return TrueRNG.OriginalRandomFunction();
        }
        if (!TrueRNG.RandomNumbers.length) {
            DebugLog(`\tNo Random Numbers`);
            if (!TrueRNG.AwaitingResponse) {
                TrueRNG.UpdateRandomNumbers();
            }
            return TrueRNG.OriginalRandomFunction();
        }
        DebugLog(`max: ${TrueRNG.MaxCachedNumbers} update: ${TrueRNG.UpdatePoint} val: ${TrueRNG.RandomNumbers.length / TrueRNG.MaxCachedNumbers}`);
        if ((TrueRNG.RandomNumbers.length / TrueRNG.MaxCachedNumbers) < TrueRNG.UpdatePoint) {
            DebugLog(`\tLimited Random Numbers Available`);
            if (!TrueRNG.AwaitingResponse) {
                TrueRNG.UpdateRandomNumbers();
            }
        }
        DebugLog(`\tSuccess`);
        if (TrueRNG.RandomNumbers.length <= 10) {
            TrueRNG.UpdateRandomNumbers();
        }
        let ms = new Date().getTime();
        let index = ms % TrueRNG.RandomNumbers.length;
        let rng = TrueRNG.RandomNumbers[index];
        TrueRNG.RandomNumbers.splice(index, 1);
        DebugLog(`\tReturning ${rng}`, rng, index, ms);
        return rng;
    }
}
TrueRNG.RandomNumbers = [];
TrueRNG.HasAlerted = false;
export class Debug {
    get() {
        return game.settings.get("TrueRNG", "DEBUG");
    }
    static Log(message, ...params) {
        if (Debug)
            ;
    }
}
function DebugLog(message, ...params) {
    if (game.settings.get("TrueRNG", "DEBUG")) {
        console.log(message, params);
    }
}
//# sourceMappingURL=TrueRNG.js.map