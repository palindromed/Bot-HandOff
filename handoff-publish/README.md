# Bot-HandOff

A common request from companies and organizations considering bots is the ability to "hand off" a customer from a bot to a human agent, as seamlessly as possible.

This project implements a framework called **Handoff** which enables bot authors to implement a wide variety of scenarios, including a full-fledged call center app, with minimal changes to the actual bot.

It also includes a very simple implementation that illustrates the core concepts with minimal configuration.

This project is in heavy flux, but is now in a usable state. However this should still be considered a sample, and not an officially supported Microsoft product.

This project is written in TypeScript.

[Source Code](https://github.com/palindromed/Bot-HandOff/tree/npm-handoff)

See [example folder](https://github.com/palindromed/Bot-HandOff/tree/npm-handoff/example) for a full bot example.

## Basic Usage

```javascript
// Imports
const express = require('express');
const builder = require('botbuilder');
const handoff = require('botbuilder-handoff');

// Setup Express Server (N.B: If you are already using restify for your bot, you will need replace it with an express server)
const app = express();
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});

// Replace this functions with custom login/verification for agents
const isAgent = (session) => session.message.user.name.startsWith("Agent");

/**
    bot: builder.UniversalBot
    app: express ( e.g. const app = express(); )
    isAgent: function to determine when agent is talking to the bot
    options: { }
        - mongodbProvider and directlineSecret are required (both can be left out of setup options if provided in environment variables.)
        - textAnalyticsKey is optional. This is the Microsoft Cognitive Services Text Analytics key. Providing this value will result in running sentiment analysis on all user text, saving the sentiment score to the transcript in mongodb.
        - appInsightsInstrumentationKey is optional. This is the Microsoft Application Insights Instrumentation Key. Providing this value will result in logging all of the conversation objects to application insights as a custom event called 'Conversation'
**/
handoff.setup(bot, app, isAgent, {
    mongodbProvider: process.env.MONGODB_PROVIDER,
    directlineSecret: process.env.MICROSOFT_DIRECTLINE_SECRET,
    textAnalyticsKey: process.env.CG_SENTIMENT_KEY,
    appInsightsInstrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY
});

```

If you want to keep the data after a hand off, you must add this environment variable. Otherwise, after an agent disconnects from talking to the user, the entire conversation object will be delered from the database.

```
"RETAIN_DATA" : "true"  
```

If you want the sample `/webchat` endpoint to work (endpoint for the example agent / call center), you will need to include this [`public` folder](https://github.com/palindromed/Bot-HandOff/tree/npm-handoff/example/public) in the root directory of your project, or replace with your own.

Required environment variables:
```
"MICROSOFT_APP_ID" : "",
"MICROSOFT_APP_PASSWORD" : "",
"MICROSOFT_DIRECTLINE_SECRET" : "",
"MONGODB_PROVIDER" : ""      
```

Optional environment variables:
```
"CG_SENTIMENT_KEY" : "",
"APPINSIGHTS_INSTRUMENTATIONKEY" : "",
"RETAIN_DATA: "true" or "false"
```

## License

MIT License