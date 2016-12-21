var express = require('express');
var builder = require('botbuilder');
var app = express();


//=========================================================
// Bot Setup
//=========================================================

// Setup Express Server

app.listen(3978, function () {
    console.log('server up');
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


//=========================================================
// Bots Dialogs
//=========================================================

var emergencies = ["Health", "Crime", "Catastrophe"];

bot.dialog('/', [
    //welcome the user, ask the emergency
    function (session) {
        session.send("Hello");
        builder.Prompts.choice(session, "What's the emergency?", emergencies);
    },
    //work with selected emergency
    function (session, results) {
        session.userData.emergency = results.response.entity;
        switch (session.userData.emergency) {
            case emergencies[0]:
                session.send(emergencies[0]);
                session.replaceDialog('/Health');
                break;
            case emergencies[1]:
                session.send(emergencies[1]);
                break;
            case emergencies[2]:
                session.send(emergencies[2]);
                break;
            default:
        }
    }
]);

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
