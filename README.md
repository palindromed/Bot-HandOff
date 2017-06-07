# Bot-HandOff

A common request from companies and organizations considering bots is the ability to "hand off" a customer from a bot to a human agent, as seamlessly as possible.

This project implements an unopinionated core framework called **Handoff** which enables bot authors to implement a wide variety of scenarios, including a full-fledged call center app, with minimal changes to the actual bot.

It also includes a very simple implementation that illustrates the core concepts with minimal configuration.

This project is in heavy flux, but is now in a usable state. However this should still be considered a sample, and not an officially supported Microsoft product.

This project is written in TypeScript.

[Source Code](https://github.com/liliankasem/Bot-HandOff/tree/v.1.0.0)

See [example folder](https://github.com/liliankasem/Bot-HandOff/tree/v.1.0.0/example) for a full bot example.

## Basic Usage

```javascript
// Imports
const express = require('express');
const builder = require('botbuilder');
const bot_handoff = require('bot_handoff');

// Setup Express Server (N.B: If you are already using restify for your bot, you will need replace it with an express server)
const app = express();
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});

// Replace these two functions with custom login/verification for agents and operators
const isAgent = (session) => session.message.user.name.startsWith("Agent");
const isOperator = (session) => session.message.user.name.startsWith("Operator");

/**
    bot: builder.UniversalBot
    app: express ( e.g. const app = express(); )
    isAgent: function to determine when agent is talking to the bot
    isOperator: function to determine when operator is talking to the bot 
                NB - recommended not to change the operator function as this is what the IBEX dashboard is looking for
    options: { }
        - mongodbProvider and directlineSecret are required (both can be left out of setup options if provided in environment variables.)
        - textAnalyiticsKey is optional. This is the Microsoft Cognitive Services Text Analytics key. Providing this value will result in running sentiment analysis on all user text, saving the sentiment score to the transcript in mongodb.
**/
bot_handoff.setup(bot, app, isAgent, isOperator, {
    mongodbProvider: process.env.MONGODB_PROVIDER,
    directlineSecret: process.env.MICROSOFT_DIRECTLINE_SECRET,
    textAnalyiticsKey: process.env.CS_TEXT_ANALYITCS_KEY
});

```

If you want the sample `/webchat` endpoint to work (endpoint for the example agent / call center), you will need to include this [`public` folder](https://github.com/liliankasem/Bot-HandOff/tree/v.1.0.0/example/public) in the root directory of your project, or replace with your own.

Required environment variables:
```
"MICROSOFT_APP_ID" : "",
"MICROSOFT_APP_PASSWORD" : "",
"MICROSOFT_DIRECTLINE_SECRET" : "",
"MONGODB_PROVIDER" : ""      
```

## License

MIT License