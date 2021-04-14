import { TrueRNG as rngType } from './TrueRNG.js';
import { Debug } from './Debug.js';
import { RandomAPI } from './RandomAPI.js';
// import { Hooks } from './Foundry-Types/Hooks';
// @ts-ignore
Hooks.on("ready", () => {
    // create a dummy truerng
    let rng = new rngType();
    // It validates these two properties so we need something there.
    rng.RandomGenerator = new RandomAPI("dummy-api-key");
    rng.RandomNumbers.push(1.0, 1.0, 1.0, 1.0, 1.0);
    rng.UpdatePoint = Number.MAX_SAFE_INTEGER;
    //#region PreHook overwrite function
    rng.PreRNGEventHandler = (self, getRandomNumber) => {
        getRandomNumber.Reference = () => {
            return 0.0;
        };
    };
    rng.PostRNGEventHandler = (self, resultReference) => {
        Debug.WriteLine(`Testing that prehook function was overwrote...`);
        Debug.Assert(resultReference.Reference === 0.0, resultReference.Reference, 0.0);
        Debug.WriteLine(`Passed!`);
    };
    rng.GetRandomNumber();
    //#endregion
    //#region PreHook overwrite function #2
    Debug.WriteLine(`Testing that prehook function was overwrote Again...`);
    Debug.Assert(rng.LastRandomNumber === 0.0, rng.LastRandomNumber, 0.0);
    Debug.WriteLine(`Passed!`);
    //#endregion
    //#region PreHook return early
    rng.PostRNGEventHandler = (self, result) => {
        Debug.WriteLine(`Testing the pre hook forced it to return early`);
        Debug.Assert(result.Reference !== 1.0, result.Reference, 0.0);
        Debug.WriteLine(`Passed!`);
    };
    rng.PreRNGEventHandler = (self, getRandomNumber) => {
        getRandomNumber.Reference = () => {
            return 1.0;
        };
        return true;
    };
    rng.GetRandomNumber();
    //#endregion
    //#region PostHook overwrite return value
    rng.PostRNGEventHandler = (self, result) => {
        result.Reference = 2.0;
    };
    rng.GetRandomNumber();
    Debug.WriteLine(`Testing that post hook is able to overwrite random numbers`);
    Debug.Assert(rng.LastRandomNumber === 2.0, rng.LastRandomNumber, 2.0);
    //#endregion
    Debug.WriteLine(`All test have passed!!!`);
});
//# sourceMappingURL=Tests.js.map