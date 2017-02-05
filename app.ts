import * as express from 'express';
import * as builder from 'botbuilder';
import * as cognitiveservices from 'botbuilder-cognitiveservices';
import { Handoff } from './handoff';
import { commandsMiddleware } from './commands';

//=========================================================
// Bot Setup
//=========================================================

const app = express();

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
app.use('/webchat', express.static('public'));

// replace this function with custom login/verification for agents
const isAgent = (session: builder.Session) => 
    session.message.user.name.startsWith("Agent");

const handoff = new Handoff(bot, isAgent);

//========================================================
// Bot Middleware
//========================================================
bot.use(
    commandsMiddleware(handoff),
    handoff.routingMiddleware(),
    /* other bot middlware should probably go here */
);

//=========================================================
// Bots Dialogs
//=========================================================


// bot.dialog('/', [
//     function (session, args, next) {
//         session.send('Echo ' + session.message.text);
//     }]);

// QnA Maker Dialogs

var recognizer = new cognitiveservices.QnAMakerRecognizer({
	knowledgeBaseId: process.env.QNAKNOWLEDGEBASE_ID, 
	subscriptionKey: process.env.QNASUBSCRIPTIONKEY
});

var BasicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({ 
	recognizers: [recognizer],
	defaultMessage: 'No good match in FAQ.',
	qnaThreshold: 0.5});

bot.dialog('/', BasicQnAMakerDialog);


