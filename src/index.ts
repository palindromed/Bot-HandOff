import { MongooseProvider, mongoose } from './mongoose-provider';
import { Handoff } from './handoff';
import { commandsMiddleware } from './commands';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';

//export {MongooseProvider, Handoff, commandsMiddleware};

let setup = (bot, app, isAgent, isOperator, options) => {  

    let _directLineSecret = "";
    let _mongodbProvider = "";
    let mongooseProvider = null;

    options = options || {};

    if (!options.mongodbProvider && !process.env.MONGODB_PROVIDER){
        throw new Error('Mongo DB Connection String was not provided in options or the environment variable MONGODB_PROVIDER');
    } else {
        _mongodbProvider = options.mongodbProvider || process.env.MONGODB_PROVIDER;
        mongooseProvider = new MongooseProvider();
        mongoose.connect(_mongodbProvider);
    }

    if (!options.directlineSecret && !process.env.MICROSOFT_DIRECTLINE_SECRET) {
        throw new Error('Microsoft Bot Builder Direct Line Secret was not provided in options or the environment variable MICROSOFT_DIRECTLINE_SECRET');
    } else {
        _directLineSecret = options.directlineSecret || process.env.MICROSOFT_DIRECTLINE_SECRET;
    }

    const handoff = new Handoff(bot, isAgent, isOperator);

    if (bot) {
        bot.use(
            commandsMiddleware(handoff),
            handoff.routingMiddleware(),
        )
    }

    if(app && _directLineSecret !=""){
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
                if (authHeader === 'Bearer ' + _directLineSecret) {
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
                if (authHeader === 'Bearer ' + _directLineSecret) {
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
    }else{
        throw new Error('Microsoft Bot Builder Direct Line Secret was not provided in options or the environment variable MICROSOFT_DIRECTLINE_SECRET');
    }
}

module.exports = {setup}