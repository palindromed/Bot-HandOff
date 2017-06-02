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
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
//export {MongooseProvider, Handoff, commandsMiddleware};
let setup = (bot, app, isAgent, isOperator, options) => {
    let _directLineSecret = "";
    let _mongodbProvider = "";
    let mongooseProvider = null;
    options = options || {};
    if (!options.mongodbProvider && !process.env.MONGODB_PROVIDER) {
        throw new Error('Mongo DB Connection String was not provided in options or the environment variable MONGODB_PROVIDER');
    }
    else {
        _mongodbProvider = options.mongodbProvider || process.env.MONGODB_PROVIDER;
        mongooseProvider = new mongoose_provider_1.MongooseProvider();
        mongoose_provider_1.mongoose.connect(_mongodbProvider);
    }
    if (!options.directlineSecret && !process.env.MICROSOFT_DIRECTLINE_SECRET) {
        throw new Error('Microsoft Bot Builder Direct Line Secret was not provided in options or the environment variable MICROSOFT_DIRECTLINE_SECRET');
    }
    else {
        _directLineSecret = options.directlineSecret || process.env.MICROSOFT_DIRECTLINE_SECRET;
    }
    const handoff = new handoff_1.Handoff(bot, isAgent, isOperator);
    if (bot) {
        bot.use(commands_1.commandsMiddleware(handoff), handoff.routingMiddleware());
    }
    if (app && _directLineSecret != "") {
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