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
    for (var addy in checkIn) {
        if (addy !== session.message.address.user.id) {
            return checkIn[addy];
        }
    }
}

//=========================================================
// Bots Dialogs
//=========================================================

var emergencies = ["Health", "Crime", "Catastrophe"];

bot.dialog('/', [
    //welcome the user, ask the emergency
    function (session, args, next) {
        session.privateConversationData.contactInfo = conectorQueue(session.message.address);
        if (session.privateConversationData.contactInfo) {
            session.replaceDialog('/handOff');
        } else {
            next();
        }


    }, function (session, response, next) {
        session.send('no addresses to hand off to yet. Trying again');
        session.replaceDialog('/');
    }

]);

bot.dialog('/handOff', [
    function (session, args, next) {
        if (session.message.text !== 'break') {
            bot.send(
                new builder.Message()
                    .text(session.message.text)
                    .address(session.privateConversationData.contactInfo));
        } else {
            session.endConversation('bye');
        }

    }



])
