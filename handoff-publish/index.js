"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_provider_1 = require("./mongoose-provider");
const handoff_1 = require("./handoff");
const commands_1 = require("./commands");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
let appInsights = require('applicationinsights');
let setup = (bot, app, isAgent, options) => {
    let appInsightsClient = null;
    let mongooseProvider = null;
    let _directLineSecret = null;
    let _mongodbProvider = null;
    let _textAnalyticsKey = null;
    let _appInsightsInstrumentationKey = null;
    const handoff = new handoff_1.Handoff(bot, isAgent);
    options = options || {};
    if (!options.mongodbProvider && !process.env.MONGODB_PROVIDER) {
        throw new Error('Bot-Handoff: Mongo DB Connection String was not provided in setup options or the environment variable MONGODB_PROVIDER');
    }
    else {
        _mongodbProvider = options.mongodbProvider || process.env.MONGODB_PROVIDER;
        mongooseProvider = new mongoose_provider_1.MongooseProvider();
        mongoose_provider_1.mongoose.connect(_mongodbProvider);
    }
    if (!options.directlineSecret && !process.env.MICROSOFT_DIRECTLINE_SECRET) {
        throw new Error('Bot-Handoff: Microsoft Bot Builder Direct Line Secret was not provided in setup options or the environment variable MICROSOFT_DIRECTLINE_SECRET');
    }
    else {
        _directLineSecret = options.directlineSecret || process.env.MICROSOFT_DIRECTLINE_SECRET;
    }
    if (!options.textAnalyticsKey && !process.env.CG_SENTIMENT_KEY) {
        console.warn('Bot-Handoff: Microsoft Cognitive Services Text Analytics Key was not provided in setup options or the environment variable CG_SENTIMENT_KEY. Sentiment will not be analysed in the transcript, the score will be recorded as -1 for all text.');
    }
    else {
        _textAnalyticsKey = options.textAnalyticsKey || process.env.CG_SENTIMENT_KEY;
        exports._textAnalyticsKey = _textAnalyticsKey;
    }
    if (!options.appInsightsInstrumentationKey && !process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
        console.warn('Bot-Handoff: Microsoft Application Insights Instrumentation Key was not provided in setup options or the environment variable APPINSIGHTS_INSTRUMENTATIONKEY. The conversation object will not be logged to Application Insights.');
    }
    else {
        _appInsightsInstrumentationKey = options.appInsightsInstrumentationKey || process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
        appInsights.setup(_appInsightsInstrumentationKey).start();
        appInsightsClient = appInsights.getClient;
        exports._appInsightsClient = appInsightsClient;
    }
    if (bot) {
        bot.use(commands_1.commandsMiddleware(handoff), handoff.routingMiddleware());
    }
    if (app && _directLineSecret != null) {
        app.use(cors({ origin: '*' }));
        app.use(bodyParser.json());
        // Create endpoint for agent / call center
        app.use('/webchat', express.static('public'));
        // Endpoint to get current conversations
        app.get('/api/conversations', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const authHeader = req.headers['authorization'];
            console.log(authHeader);
            console.log(req.headers);
            if (authHeader) {
                if (authHeader === 'Bearer ' + _directLineSecret) {
                    let conversations = yield mongooseProvider.getCurrentConversations();
                    res.status(200).send(conversations);
                }
            }
            res.status(401).send('Not Authorized');
        }));
        // Endpoint to trigger handover
        app.post('/api/conversations', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const authHeader = req.headers['authorization'];
            console.log(authHeader);
            console.log(req.headers);
            if (authHeader) {
                if (authHeader === 'Bearer ' + _directLineSecret) {
                    if (yield handoff.queueCustomerForAgent({ customerConversationId: req.body.conversationId })) {
                        res.status(200).send({ "code": 200, "message": "OK" });
                    }
                    else {
                        res.status(400).send({ "code": 400, "message": "Can't find conversation ID" });
                    }
                }
            }
            else {
                res.status(401).send({ "code": 401, "message": "Not Authorized" });
            }
        }));
    }
    else {
        throw new Error('Microsoft Bot Builder Direct Line Secret was not provided in options or the environment variable MICROSOFT_DIRECTLINE_SECRET');
    }
};
module.exports = { setup };
//# sourceMappingURL=index.js.map