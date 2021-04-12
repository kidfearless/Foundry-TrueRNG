import { RandomAPI } from "./RandomAPI.js";
Hooks.once('init', () => {
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
                TrueRNG.UpdatePoint = parseFloat(updatePoint) * 0.01;
            }
        };
    game.settings.register("TrueRNG", "UPDATEPOINT", params);
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
        TrueRNG.RandomGenerator = new RandomAPI(key);
        TrueRNG.UpdateRandomNumbers();
    }
    static UpdateRandomNumbers() {
        if (TrueRNG.AwaitingResponse) {
            return;
        }
        TrueRNG.AwaitingResponse = true;
        TrueRNG.RandomGenerator.GenerateDecimals({ decimalPlaces: 5, n: TrueRNG.MaxCachedNumbers })
            .then((response) => {
            TrueRNG.RandomNumbers = TrueRNG.RandomNumbers.concat(response.data);
        })
            .catch((reason) => {
        })
            .finally(() => {
            TrueRNG.AwaitingResponse = false;
        });
    }
    static GetRandomNumber() {
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
            return TrueRNG.OriginalRandomFunction();
        }
        if (!TrueRNG.RandomNumbers.length) {
            if (!TrueRNG.AwaitingResponse) {
                TrueRNG.UpdateRandomNumbers();
            }
            return TrueRNG.OriginalRandomFunction();
        }
        if ((TrueRNG.RandomNumbers.length / TrueRNG.MaxCachedNumbers) < TrueRNG.UpdatePoint) {
            if (!TrueRNG.AwaitingResponse) {
                TrueRNG.UpdateRandomNumbers();
            }
        }
        if (TrueRNG.RandomNumbers.length <= 10) {
            TrueRNG.UpdateRandomNumbers();
        }
        let ms = new Date().getTime();
        let index = ms % TrueRNG.RandomNumbers.length;
        let rng = TrueRNG.RandomNumbers[index];
        TrueRNG.RandomNumbers.splice(index, 1);
        return rng;
    }
}
TrueRNG.RandomNumbers = [];
TrueRNG.HasAlerted = false;
//# sourceMappingURL=TrueRNG.js.map