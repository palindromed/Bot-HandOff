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
    // console.log(checkIn);
}

//=========================================================
// Bots Dialogs
//=========================================================

var emergencies = ["Health", "Crime", "Catastrophe"];

bot.dialog('/', [
    //welcome the user, ask the emergency
    function (session, args, next) {
        connectorQueue(session.message.address);
        for (var addy in checkIn) {
            console.log('checkIn');
            console.log(checkIn);
            console.log(addy);
            if (addy !== session.message.address.user.id) {
                console.log(checkIn[addy]);

                // session.privateConversationData.connect = checkIn[addy];
                next({ results: checkIn[addy] });
                // break;
            }
        }
        // session.replaceDialog('/Health');

        // session.replaceDialog('/chats');

        // builder.Prompts.choice(session, "What's the emergency?", emergencies);
    }, function (session, response, next) {
        console.log(response);
        if (session.message.text !== 'break') {
            bot.send(
                new builder.Message()
                    .text(session.message.text)
                    .address(response.results));
        } else {
            session.endConversation('bye');
        }

    }]);


