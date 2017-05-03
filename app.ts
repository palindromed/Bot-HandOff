import * as express from 'express';
import * as builder from 'botbuilder';
import { Handoff } from './handoff';
import { commandsMiddleware } from './commands';
import { askAgent } from './askAgent';

//=========================================================
// Bot Setup
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
const bot = new builder.UniversalBot(connector, [
    (session) => {
        session.endDialog('Welcome to the handoff bot! \nType "help" to be connected to an agent');
    }
]);
app.post('/api/messages', connector.listen());

// Create endpoint for agent / call center
app.use('/webchat', express.static('public'));

// replace this function with custom login/verification for agents
const isAgent = (session: builder.Session) =>
    session.message.user.name.startsWith("Agent");

const handoff = new Handoff(bot, isAgent);

//========================================================
// Bot Middleware
//========================================================
bot.use(
    commandsMiddleware(handoff), // Check for specified inputs
    handoff.routingMiddleware(), // Decide where to send the message
    /* other bot middlware should probably go here */
);

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('special', [
    (session, args, next) => {
        askAgent(bot, session, handoff).then(response => {
            session.send('Echo ' + session.message.text);
            if (response) {
                const toSend = response.toString();
                session.send(toSend);
            }
        }).catch(err => {
            console.log('err: ' + err);
        })
        session.endDialog();
    }
]).triggerAction({ matches: [/problem/i, /special/i] });


