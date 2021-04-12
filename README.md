# TrueRNG
This module implements random.org's true random number generator service into the dice rolls of Foundry-VTT. In order to use the module you will need to generate a free api key from https://api.random.org/dashboard

## Tnstallation
* Install the module using the following manifest url: [TODO]
* As GameMaster go to the "Module Settings" tab inside "Configure Settings" and paste in your api key under "Random.org API Key"
* Save Changes. The clients will now all start pulling in random numbers from random.org

## Configuration
`Random.org API Key` - Required in order to function properly. If you don't provide an api key then Foundry's original random number generator is used.

`Max Cached Dice` - This is the amount of random numbers to pull in at a time for each client. The developer api key is limited on how many numbers it can generate in a day. 
So if you have a large number of players or reload the game a lot throughout the session I recommend keeping this `low`.
If you are playing a game that requires rolling large quantities of dice then I recommend setting this `high`.

`Update Point` - Every time a dice is rolled the client checks how many cached values it has left. With the default values it will pull in 50(Max Cached Dice) once it falls below 50%(Update Point). 
In that example at 25 cached dice it will generate 50 more random numbers and add them to the existing cache. Again adjust this value based of the number of rolls you do in your game at once. 

## Implementation Notes
When the module is loaded it replaces the cached random number generator function in `CONFIG.Dice.randomUniform` with it's own `TrueRNG.GetRandomNumber` 
as well as caching the original in case of user/server error. It will then generate some server settings and try to grab the current api key. 
If the api key exists then it makes a request to random.org immediately, otherwise it will wait for an api key to be set before trying again.
The random numbers are stored in an array and are unique for each client as it turns out that the dice rng function is client sided.
Once the client rolls a dice it will get the current time in milliseconds and modulus it by the length of the current cached values. 
I did this because I didn't like the idea of a players role being predetermined at the start of each game. 
This at least makes it so that the rolls you get are determined at the start, the order that you get them is random.
