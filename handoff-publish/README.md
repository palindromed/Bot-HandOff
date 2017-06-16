# botbuilder-handoff

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
**/
handoff.setup(bot, app, isAgent, {
    mongodbProvider: process.env.MONGODB_PROVIDER,
    directlineSecret: process.env.MICROSOFT_DIRECTLINE_SECRET,
    textAnalyticsKey: process.env.CG_SENTIMENT_KEY,
    appInsightsInstrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
    retainData: process.env.RETAIN_DATA,
    customerStartHandoffCommand: process.env.CUSTOMER_START_HANDOFF_COMMAND
});

```

### Settings

You can either provide these settings in the options of `handoff.setup()` or just provide them as environment variables.

#### mongodbProvider
`{mongodbProvider: process.env.MONGODB_PROVIDER}`

mongodbProvider  is a required field. This is your mongodb connection string.

#### directlineSecret
`{directlineSecret: process.env.MICROSOFT_DIRECTLINE_SECRET}`

directlineSecret is a required field. This is your bot's direct line sectet key; you can get this from the bot framework portal when you setup the direct line channel.

#### textAnalyticsKey
`{textAnalyticsKey: process.env.CG_SENTIMENT_KEY}`

textAnalyticsKey is optional. This is the Microsoft Cognitive Services Text Analytics key. Providing this value will result in running sentiment analysis on all user messages, saving the sentiment score to the transcript in mongodb.

#### appInsightsInstrumentationKey
`{appInsightsInstrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY}`

appInsightsInstrumentationKey is optional. This is the Microsoft Application Insights Instrumentation Key. Providing this value will result in logging most values of the conversation object to application insights as a custom event called 'Transcript'.

The values logged to application ingsights are:

``` javascript
botId 
customerId 
customerName
customerChannelId
customerConversationId 

//If the user has spoken to an agent, these values are also logged:

agentId
agentName
agentChannelId
agentConversationId

```

#### retainData
`{ retainData: process.env.RETAIN_DATA }`

retainData is optional. If you want to keep the data after a hand off, you must add this environment variable/option. Otherwise, after an agent disconnects from talking to the user, the entire conversation object will be deleted from the database. This can be `"true"` or `"false"`.

#### customerStartHandoffCommand
`{customerStartHandoffCommand: process.env.CUSTOMER_START_HANDOFF_COMMAND}`

customerStartHandoffCommand is optional. This is the command that a user (customer, not agent) can type to start the handoff which will queue them to speak to an agent. The default command will be set to `"help"`. Regex is used on this command to make sure the activation of the handoff only works if the user types the exact phrase provided in this property.

#### Required environment variables:
```
"MICROSOFT_APP_ID" : "",
"MICROSOFT_APP_PASSWORD" : "",
"MICROSOFT_DIRECTLINE_SECRET" : "",
"MONGODB_PROVIDER" : ""      
```

#### Optional environment variables:
```
"CG_SENTIMENT_KEY" : "",
"APPINSIGHTS_INSTRUMENTATIONKEY" : "",
"RETAIN_DATA: "true" or "false"
"CUSTOMER_START_HANDOFF_COMMAND" : ""
```

### Sample Webchat

If you want the sample `/webchat` endpoint to work (endpoint for the example agent / call center), you will need to include this [`public` folder](https://github.com/palindromed/Bot-HandOff/tree/npm-handoff/example/public) in the root directory of your project, or replace with your own.

## License

MIT License