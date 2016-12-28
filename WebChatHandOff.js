var express = require('express');
var builder = require('botbuilder');
var app = express();
var checkIn = {};

//=========================================================
// Bot Setup
//=========================================================

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

var connectorQueue = function (deets) {
    checkIn[deets.user.id] = deets;
};

//========================================================
// Bot Middleware
//========================================================
bot.on('send', (message) => {
    if (message.text === 'bye') {
        bot.beginDialog(message.address, '/greet')
    };
});
//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session, args, next) {
        connectorQueue(session.message.address);
        for (var addy in checkIn) {
            if (addy !== session.message.address.user.id) {
                session.privateConversationData.contacts = checkIn[addy];
                session.replaceDialog('/handOff');
            }
        }
        if (!session.privateConversationData.contacts) {
            session.endDialog('No one to connect you to yet. Try again soon.')
        };
    }]);

bot.dialog('/handOff', [
    function (session, response, next) {
        if (session.message.text !== 'break') {
            bot.send(
                new builder.Message()
                    .text(session.message.text)
                    .address(session.privateConversationData.contacts));
        } else {
            bot.send(
                new builder.Message()
                    .text('bye')
                    .address(session.privateConversationData.contacts));
        }
    }
]);


// A simple example from existing Microsoft Bot Framework Sample code
bot.dialog('/greet', [
    (session, args, next) => {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        }
        else {
            next();
        }
    },
    (session, results, next) => {
        session.send('Hello %s!', session.userData.name);
        next();
    },
    (session, results, next) => {
        session.endConversation();
    }
]);
bot.dialog('/profile', [
    (session) => {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    (session, results) => {
        session.userData.name = results.response;
        session.endDialog();
    }
]);
// end simple example code

// TODO make someone call center, pass user to/from bot