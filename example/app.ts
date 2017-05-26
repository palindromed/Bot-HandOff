import * as express from 'express';
import * as builder from 'botbuilder';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as bot_handoff from 'bot_handoff';

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
const mongooseProvider = new bot_handoff.MongooseProvider();

// Replace this function with custom login/verification for agents
const isAgent = (session: builder.Session) => session.message.user.name.startsWith("Agent");
const isOperator = (session: builder.Session) => session.message.user.name.startsWith("Operator");

const handoff = new bot_handoff.Handoff(bot, isAgent, isOperator);

//=========================================================
// API

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Create endpoint for agent / call center
app.use('/webchat', express.static('public'));

// Endpoint to get current conversations
app.get('/api/conversations', async (req, res) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    console.log(req.headers);
    if (authHeader) {
        if (authHeader === 'Bearer ' + process.env.MICROSOFT_DIRECTLINE_SECRET) {
            let conversations = await mongooseProvider.getCurrentConversations()
            res.status(200).send(conversations);
        }
    }
    res.status(401).send('Not Authorized');
});

// Endpoint to trigger handover
app.post('/api/conversations', async (req, res) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    console.log(req.headers);
    if (authHeader) {
        if (authHeader === 'Bearer ' + process.env.MICROSOFT_DIRECTLINE_SECRET) {
            if (await handoff.queueCustomerForAgent({ customerConversationId: req.body.conversationId })) {
                res.status(200).send({ "code": 200, "message": "OK" });
            } else {
                res.status(400).send({ "code": 400, "message": "Can't find conversation ID" });
            }
        }
    } else {
        res.status(401).send({ "code": 401, "message": "Not Authorized" });
    }
});

//=========================================================
// Middleware

bot.use(
    bot_handoff.commandsMiddleware(handoff),
    handoff.routingMiddleware(),
);

