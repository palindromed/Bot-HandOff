import * as express from 'express';
import * as builder from 'botbuilder';
import { handoffMiddleware, addHandoffHooks } from './handoff';

//=========================================================
// Bot Setup
//=========================================================

var app = express();

// Setup Express Server
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
app.post('/api/messages', connector.listen());

// Create endpoint for agent / call center
app.use('/agent', express.static('public'));

addHandoffHooks(app);

//========================================================
// Bot Middleware
//========================================================
bot.use(handoffMiddleware(bot));

//=========================================================
// Bots Dialogs
//=========================================================


bot.dialog('/', [
    function (session, args, next) {
        session.send('Echo ' + session.message.text);
    }]);


