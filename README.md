# Bot-HandOff

A common request from companies and organizations considering bots is the ability to "hand off" a customer from a bot to a human agent, as seamlessly as possible.

This project implements an unopinionated core framework called **Handoff** which enables bot authors to implement a wide variety of scenarios, including a full-fledged call center app, with minimal changes to the actual bot.

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
**/
handoff.setup(bot, app, isAgent, {
    mongodbProvider: process.env.MONGODB_PROVIDER,
    directlineSecret: process.env.MICROSOFT_DIRECTLINE_SECRET,
    textAnalyticsKey: process.env.CG_SENTIMENT_KEY
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
"CG_SENTIMENT_KEY" : ""
"RETAIN_DATA: "true" or "false"
```

## Hand Off Details

Depending on how your bot is written, this could happen via any or all of:

* customer request (e.g. "I want to talk to a human!" or just "help")
* bot logic (e.g. sentiment analysis determines user is getting frustrated)
* agent action

The Handoff framework allows the bot author to decide the triggers for putting the customer into the Waiting state.

Depending on how your bot is written, they can exit this state by any or all of:

* customer request ("Just let me talk to the bot" or "nevermind")
* an agent connecting to them
* bot logic (e.g. customer has waited too long)

#### Customer <-> Agent

A customer can be connected to an agent whether they are talking to the Bot, another Agent, or are Waiting.

An Agent can connect to a specific customer (waiting or not) or to the 'best choice' of customers (e.g. the one who has been waiting the longest).

Depending on how your bot is written, this can happen progamatically (automatically connect user to agents) or by agent action.
However in this version of the framework there is no concept of a directory of agents availability thereof.
So at the moment this happens primarily through an agent manually choosing to connect to a customer.

### Agent Monitoring

An Agent can monitor a Customer conversation without interfering in bot funtionality.

Messages will go between Customer and the bot as well as Customer and Agent.

The connected Agent can then choose to take over (change state to *Agent*) or disconnect (change state to *Bot*)

### Conversational Metadata and Provider

Handoff depends on a database of conversations, including a transcription of every message sent between customer and bot, or between customer and agent.
Handoff ships with a default in-memory provider, but production bots should supply their own, using persistant storage.

A Handoff Conversation consists of:

* address information for this conversation with the customer
* the current state of this conversation (Bot, Waiting, or Agent)
* the conversational transcript
* address information for the agent, if the agent is currently connected to this customer

(Handoff does not record conversational metadata for the Agent, except when they are connected to a customer)

### Message router

The heart of Handoff is the message router. Using the conversational metadata above, each message from a Customer, Bot, or Agent is routed approprately.
This is implemented as Bot middleware, and can be combined with any other middleware your bot is already using as you see fit.

### Agent recognition

Customers and Agents are both just users connected to bots, so Handoff needs a way to identify an Agent as such. There are multiple ways this could happen:

* create a hardcoded directory of channel-specific user ids for Agents, e.g. "Fred Doe on Facebook Messenger is one of our Agents"
* create a WebChat-based call center app that specially encodes Agent user ids, e.g "Agent001", "Agent002". WebChat makes this easy to do.
* create a WebChat-based call center app that authenticates users and then passes auth tokens to the bot via WebChat backchannel
* use authbot to identify the user as an Agent via OAuth2, e.g. "This authenticated user is marked as an Agent in our employee database"
* ... and so on.

Handoff is unopinionated about how this should happen. It requires the bot author to pass in a function of the form `isAgent(session: Session) => boolean`, on the
assumption that all of the above techniques will ultimately record the Agent-ness of a particular user in a way that can be gleaned by the session object,
most typically via the bot state service.

This sample project adopts an extremely simple approach: it asks each user for an id, and if begins with "Agent" they are an Agent!

## This sample

This sample includes:

* A rudimentary echo bot
* A simple WebChat-based front end for use by both Customers and Agents
* rudimentary agent recognition via the userid entered by users
* middleware which allows Customers and Agents to enter commands through WebChat that are interpreted and turned into Handoff method calls
* no persistant data provider - it uses the default in-memory provider


## How to use this code

In future we plan to extract the core `Handoff` object into its own npm package that can be included in any bot.

For now, the easiest thing to do is to add your bot logic to the existing app.ts file.

## How to build and run this sample project

0. Clone this repo
1. If you haven't already, [Register your bot](https://dev.botframework.com/bots/new) with the Bot Framework. Copy the App ID and App Password.
2. If you haven't already, add a Direct Line (not WebChat) channel and copy one of the secret keys (not the same as the app id/secret)
3. `npm install`
4. `npm run build` (or `npm run watch` if you wish to compiled on changes to the code)

### Run in the cloud

1. Deploy your bot to the cloud
2. Aim your bot registration at your bot's endpoint (probably `https://your_domain/api/messages`)
3. Aim at least two browser instances at `https://your_domain/webchat?s=direct_line_secret_key`

### ... or run locally

1. Create an ngrok public endpoint [see here for details](https://github.com/Microsoft-DXEIP/Tokyo-Hack-Docs#1-with-your-app-still-running-on-localhost-bind-the-localhost-deployment-with-ngrok-we-will-need-this-url-for-registering-our-bot)
2. Update your bot registration to reference that endpoint (probably `https://something.ngrok.io/api/messages`)
3. Run your bot on Mac (remember to restart if you change your code):  
    Set your environment variables and run your code:  
    `MICROSOFT_APP_ID=app_id MICROSOFT_APP_PASSWORD=app_password node dist/app.js`   
4. Run your bot on Windows with PowerShell (remember to restart if you change your code):   
    Set your environment variables  
          `$env:MICROSOFT_APP_ID = "app_id"`  
          `$env:MICROSOFT_APP_PASSWORD = "app_password"`  
        Run your code:  
          `node .\dist\app.js` or `npm run start` 

5. Aim at least two browser instances at `http://localhost:3978/webchat?s=direct_line_secret_key`

### Set up your customer(s) & agent(s), and go

1. Make one or more instances an agent by giving it a user id starting with the word `Agent`
2. Make one or more instances a customer by giving it a user id *not* starting with the word `Agent`
3. The customer bot is a simple echo bot. Type `help` to request an agent.
4. As an agent, type `options` to see your available commands

## How to customize this project

Aside from providing your own bot logic, you'll likely want to build call center app for Agents, which will require:

* exposing Handoff functionality via authenticated REST endpoints
* a more sophisicated mechanism for recognizing agents
* a persistant data provider

Good luck!

## License

MIT License