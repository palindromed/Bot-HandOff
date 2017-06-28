import { MongooseProvider, mongoose } from './mongoose-provider';
import { Handoff } from './handoff';
import { commandsMiddleware } from './commands';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
let appInsights = require('applicationinsights');

export function setup(bot, app, isAgent, options) {

    let mongooseProvider = null;
    let _retainData = null;
    let _directLineSecret = null;
    let _mongodbProvider = null;
    let _textAnalyticsKey = null;
    let _appInsightsInstrumentationKey = null;
    let _customerStartHandoffCommand = null;

    const handoff = new Handoff(bot, isAgent);

    options = options || {};

    if (!options.mongodbProvider && !process.env.MONGODB_PROVIDER) {
        throw new Error('Bot-Handoff: Mongo DB Connection String was not provided in setup options (mongodbProvider) or in the environment variables (MONGODB_PROVIDER)');
    } else {
        _mongodbProvider = options.mongodbProvider || process.env.MONGODB_PROVIDER;
        mongooseProvider = new MongooseProvider();
        mongoose.connect(_mongodbProvider);
    }

    if (!options.directlineSecret && !process.env.MICROSOFT_DIRECTLINE_SECRET) {
        throw new Error('Bot-Handoff: Microsoft Bot Builder Direct Line Secret was not provided in setup options (directlineSecret) or in the environment variables (MICROSOFT_DIRECTLINE_SECRET)');
    } else {
        _directLineSecret = options.directlineSecret || process.env.MICROSOFT_DIRECTLINE_SECRET;
    }

    if (!options.textAnalyticsKey && !process.env.CG_SENTIMENT_KEY) {
        console.warn('Bot-Handoff: Microsoft Cognitive Services Text Analytics Key was not provided in setup options (textAnalyticsKey) or in the environment variables (CG_SENTIMENT_KEY). Sentiment will not be analysed in the transcript, the score will be recorded as -1 for all text.');
    } else {
        _textAnalyticsKey = options.textAnalyticsKey || process.env.CG_SENTIMENT_KEY;
        exports._textAnalyticsKey = _textAnalyticsKey;
    }

    if (!options.appInsightsInstrumentationKey && !process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
        console.warn('Bot-Handoff: Microsoft Application Insights Instrumentation Key was not provided in setup options (appInsightsInstrumentationKey) or in the environment variables (APPINSIGHTS_INSTRUMENTATIONKEY). The conversation object will not be logged to Application Insights.');
    } else {
        _appInsightsInstrumentationKey = options.appInsightsInstrumentationKey || process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
        appInsights.setup(_appInsightsInstrumentationKey).start();
        exports._appInsights = appInsights;
    }

    if (!options.retainData && !process.env.RETAIN_DATA) {
        console.warn('Bot-Handoff: Retain data value was not provided in setup options (retainData) or in the environment variables (RETAIN_DATA). Not providing this value or setting it to "false" means that if a customer speaks to an agent, the conversation record with that customer will be deleted after an agent disconnects the conversation. Set to "true" to keep all data records in the mongo database.');
    } else {
        _retainData = options.retainData || process.env.RETAIN_DATA;
        exports._retainData = _retainData;
    }

    if (!options.customerStartHandoffCommand && !process.env.CUSTOMER_START_HANDOFF_COMMAND) {
        console.warn('Bot-Handoff: The customer command to start the handoff was not provided in setup options (customerStartHandoffCommand) or in the environment variables (CUSTOMER_START_HANDOFF_COMMAND). The default command will be set to help. Regex is used on this command to make sure the activation of the handoff only works if the user types the exact phrase provided in this property.');
         _customerStartHandoffCommand = "help";
         exports._customerStartHandoffCommand = _customerStartHandoffCommand;
    } else {
        _customerStartHandoffCommand = options.customerStartHandoffCommand || process.env.CUSTOMER_START_HANDOFF_COMMAND;
        exports._customerStartHandoffCommand = _customerStartHandoffCommand;
    }

    if (bot) {
        bot.use(
            commandsMiddleware(handoff),
            handoff.routingMiddleware(),
        )
    }

    if (app && _directLineSecret != null) {
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
    } else {
        throw new Error('Microsoft Bot Builder Direct Line Secret was not provided in options or the environment variable MICROSOFT_DIRECTLINE_SECRET');
    }
}

module.exports = { setup }
