import { TrueRNG as rngType } from './TrueRNG.js';
import { Debug } from './Debug.js';
import { RandomAPI } from './RandomAPI.js';
Hooks.on("ready", () => {
    let rng = new rngType();
    rng.RandomGenerator = new RandomAPI("dummy-api-key");
    rng.RandomNumbers.push(1.0, 1.0, 1.0, 1.0, 1.0);
    rng.UpdatePoint = Number.MAX_SAFE_INTEGER;
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
    Debug.WriteLine(`Testing that prehook function was overwrote Again...`);
    Debug.Assert(rng.LastRandomNumber === 0.0, rng.LastRandomNumber, 0.0);
    Debug.WriteLine(`Passed!`);
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
    rng.PostRNGEventHandler = (self, result) => {
        result.Reference = 2.0;
    };
    rng.GetRandomNumber();
    Debug.WriteLine(`Testing that post hook is able to overwrite random numbers`);
    Debug.Assert(rng.LastRandomNumber === 2.0, rng.LastRandomNumber, 2.0);
    Debug.WriteLine(`All test have passed!!!`);
});
//# sourceMappingURL=Tests.js.map