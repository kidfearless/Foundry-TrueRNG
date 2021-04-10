import { RandomAPI } from "./RandomAPI.js";
Hooks.once('init', () => {
    console.log(`Init`);
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
            console.log(`New API KEY: ${value}`);
            TrueRNG.UpdateAPIKey(value);
        }
    };
    game.settings.register("TrueRNG", "APIKEY", params);
    let currentKey = game.settings.get("TrueRNG", "APIKEY");
    if (currentKey && currentKey.length) {
        TrueRNG.UpdateAPIKey(currentKey);
    }
});
class TrueRNG {
    static UpdateAPIKey(key) {
        console.log(`UpdateAPIKey`);
        TrueRNG.RandomGenerator = new RandomAPI(key);
        TrueRNG.UpdateRandomNumbers();
    }
    static UpdateRandomNumbers() {
        console.log(`UpdateRandomNumbers`);
        if (TrueRNG.AwaitingResponse) {
            console.log(`\tAlready awaiting a response`);
            return;
        }
        TrueRNG.AwaitingResponse = true;
        TrueRNG.RandomGenerator.GenerateDecimals({ decimalPlaces: 3, n: 20 })
            .then((response) => {
            console.log(`\tGot new random numbers`, response);
            TrueRNG.RandomNumbers = TrueRNG.RandomNumbers.concat(response.data);
        })
            .catch((reason) => {
            console.log(`\tCaught exception ${reason}`);
        })
            .finally(() => {
            console.log(`\tResetting awaiting response property`);
            TrueRNG.AwaitingResponse = false;
        });
    }
    static GetRandomNumber() {
        console.log(`GetRandomNumber`);
        if (!TrueRNG.RandomGenerator || !TrueRNG.RandomGenerator.ApiKey) {
            console.log(`\tBad API Key`);
            return TrueRNG.OriginalRandomFunction();
        }
        if (TrueRNG.RandomNumbers.length == 0) {
            console.log(`\tNo Random Numbers`);
            if (!TrueRNG.AwaitingResponse) {
                TrueRNG.UpdateRandomNumbers();
            }
            return TrueRNG.OriginalRandomFunction();
        }
        console.log(`\tSuccess`);
        if (TrueRNG.RandomNumbers.length <= 10) {
            TrueRNG.UpdateRandomNumbers();
        }
        let ms = new Date().getTime();
        let index = ms % TrueRNG.RandomNumbers.length;
        let rng = TrueRNG.RandomNumbers[index];
        TrueRNG.RandomNumbers.splice(index, 1);
        console.log(`\tReturning ${rng}`, rng, index, ms);
        return rng;
    }
}
TrueRNG.RandomNumbers = [];
//# sourceMappingURL=TrueRNG.js.map