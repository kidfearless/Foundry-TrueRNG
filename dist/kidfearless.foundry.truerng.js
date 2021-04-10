import { RandomAPI } from "./RandomAPI.js";
Hooks.once('init', () => {
    console.debug(`Init`);
    TrueRNG.OriginalRandomFunction = CONFIG.Dice.randomUniform;
    CONFIG.Dice.randomUniform = TrueRNG.GetRandomNumber;
    game.settings.register("TrueRNG", "APIKEY", {
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
    });
});
class TrueRNG {
    static UpdateAPIKey(key) {
        console.debug(`UpdateAPIKey`);
        TrueRNG.RandomGenerator = new RandomAPI(key);
        TrueRNG.UpdateRandomNumbers();
    }
    static UpdateRandomNumbers() {
        console.debug(`UpdateRandomNumbers`);
        if (TrueRNG.AwaitingResponse) {
            return;
        }
        TrueRNG.AwaitingResponse = true;
        TrueRNG.RandomGenerator.GenerateDecimals({ decimalPlaces: 3, n: 1000 }).then((response) => {
            TrueRNG.AwaitingResponse = false;
            console.debug(`Got new random numbers`, response);
            TrueRNG.RandomNumbers.concat(response.data);
        });
    }
    static GetRandomNumber() {
        console.debug(`GetRandomNumber`);
        if (!TrueRNG.RandomGenerator.ApiKey) {
            console.debug(`\tBad API Key`);
            return TrueRNG.OriginalRandomFunction();
        }
        if (!TrueRNG.RandomNumbers.length) {
            console.debug(`\tNo Random Numbers`);
            if (!TrueRNG.AwaitingResponse) {
                TrueRNG.UpdateRandomNumbers();
            }
            return TrueRNG.OriginalRandomFunction();
        }
        console.debug(`\tSuccess`);
        if (TrueRNG.RandomNumbers.length <= 100) {
            TrueRNG.UpdateRandomNumbers();
        }
        let ms = new Date().getTime();
        let index = ms % TrueRNG.RandomNumbers.length;
        let rng = TrueRNG.RandomNumbers[index];
        TrueRNG.RandomNumbers.splice(index, 1);
        console.debug(`\tReturning ${rng}`, rng, index, ms);
        return rng;
    }
}
TrueRNG.RandomNumbers = [];
//# sourceMappingURL=kidfearless.foundry.truerng.js.map