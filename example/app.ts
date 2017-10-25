import * as express from 'express';
import * as builder from 'botbuilder';
import * as handoff from 'botbuilder-handoff';

//=========================================================
// Normal Bot Setup
//=========================================================

const app = express();

// Setup Express Server
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});

// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

app.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector, [
    function (session, args, next) {
        session.endConversation('Echo ' + session.message.text);
    }
]);

//=========================================================
// Hand Off Setup
//=========================================================

// Replace this function with custom login/verification for agents
const isAgent = (session: builder.Session) => session.message.user.name.startsWith("Agent");

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