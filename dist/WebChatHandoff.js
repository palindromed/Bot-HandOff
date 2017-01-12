"use strict";
const express = require("express");
const builder = require("botbuilder");
const middleware_1 = require("./middleware");
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
middleware_1.addHandoffHooks(app);
//========================================================
// Bot Middleware
//========================================================
bot.use({
    receive: (event, next) => {
        middleware_1.route(event, bot, next);
    },
    send: (event, next) => {
        middleware_1.captureMessagesFromBot(event, next);
    }
});
//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', [
    function (session, args, next) {
        session.send('Echo ' + session.message.text);
    }
]);
