var express = require('express');
var builder = require('botbuilder');
var app = express();
var checkIn = [];



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
app.post('/api/messages', [connector.listen(), function (req, res, next) {
    console.log(req);
    console.log(res);
}]);

// Create endpoint for agent / call center
app.use('/agent', express.static('public'));
// app.post('/agent/:args', function(req, res, next) {
//     console.log('requests');
//     // connector.listen();
//     console.log(req);
//     console.log(res);
// });

var connectorQueue = function (deets) {
    // if deets don't match mine, return them?? then send msgs that way??
    console.log(deets);
    checkIn.push(deets);
    console.log(checkIn);
    // if (checkIn.length >= 2) {
    //     return checkIn[0] ? checkIn[0].user.id !== deets.user.id : checkIn[1];
    // } else {
    //     return null;
    // }
    if (deets.user.id !== 'hannah') {
        return {
            'id': 'ElDe6udZczB|000000000000000001',

            'channelId': 'directline',

            'user': { 'id': 'hannah', 'name': 'hannah' },

            'conversation': { 'id': 'ElDe6udZczB' },

            'bot': { 'id': 'handoffbotdev@Vyk0lb3f67A', 'name': 'HandOffBot' },

            'serviceUrl': 'https://directline.botframework.com',

            'useAuth': true
        }

    } else {
        return {
            'id': 'JAhN4ZEdMCv|000000000000000001',

            'channelId': 'directline',

            'user': { 'id': 'scott', 'name': 'scott' },

            'conversation': { 'id': 'JAhN4ZEdMCv' },

            'bot': { 'id': 'handoffbotdev@Vyk0lb3f67A', 'name': 'HandOffBot' },

            'serviceUrl': 'https://directline.botframework.com',

            'useAuth': true
        }

    }
}

//=========================================================
// Bots Dialogs
//=========================================================

var emergencies = ["Health", "Crime", "Catastrophe"];

bot.dialog('/', [
    //welcome the user, ask the emergency
    function (session) {
        var temp = connectorQueue(session.message.address);
        session.privateConversationData.connect = temp;

        session.replaceDialog('/chats');

        // builder.Prompts.choice(session, "What's the emergency?", emergencies);
    }
    // //work with selected emergency
    // function (session, results) {
    //     session.userData.emergency = results.response.entity;
    //     switch (session.userData.emergency) {
    //         case emergencies[0]:
    //             session.send(emergencies[0]);
    //             session.replaceDialog('/Health');
    //             break;
    //         case emergencies[1]:
    //             session.send(emergencies[1]);
    //             break;
    //         case emergencies[2]:
    //             session.send(emergencies[2]);
    //             break;
    //         default:
    //     }
    // }
]);

bot.dialog('/chats', [
    function (session, args, next) {
        if (session.message.text !== 'break') {


            bot.send(
                new builder.Message()
                    .text(session.message.text)
                    .address(session.privateConversationData.connect));
        } else {
            session.endConversation('bye');
        }
    }
])

//health conversation
bot.dialog('/Health', [
    function (session) {
        builder.Prompts.text(session, "What type of pain are you experiencing");
    },
    //figure out the type of emergency. Later use LUIS to get the emergency
    function (session, results) {
        if (results.response.includes("chest")) {
            session.userData.painType = "Chest Pain";
            builder.Prompts.choice(session, "How severe is the pain?", ["Mild", "Sharp", "Severe"]);
        } else {
            builder.Prompts.text(session, "I can only help diagnosing chestpain & headache");
            session.endConversation();
        }
    },
    function (session, results) {
        session.userData.painLevel = results.response.entity;
        switch (session.userData.painLevel) {
            case "Mild":
            case "Sharp":
                session.send("Fetching your heartrate");
                session.endConversation();

                break;
            case "Severe":
                session.send("Connecting to a Professional");
                session.endConversation();

                break;
            default:
                session.endConversation();

            //no default case required as the framework handles invalid inputs
            //and prompts the user to enter a valid input
        }
    }
]);
