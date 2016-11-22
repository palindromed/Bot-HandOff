"use strict";
// Create Bot and Intent Dialog
const builder = require('botbuilder');
const restify = require('restify');
const storage = require('./storage.js');

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('%s listening to %s', server.name, server.url);
});

// set up chat connector
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// listen for messages
server.post('/api/messages/', connector.listen());

// set up bot
const bot = new builder.UniversalBot(connector);
const intents = new builder.IntentDialog();

// Middleware functionality. Listens for call center to disconnect from help dialog
bot.on('send', (message) => {
    // watch for a unique string to be sent from the bot to the user
    if (message.text === 'Thank you for letting us help') {
        // if the text does match, begin a dialog to move user out of help dialog and disconnect from the call center
        bot.beginDialog(message.address, '/userDisconnect')
        // NOTE This is also how to start a proactive conversation with a user
    };
});


// register intents 
bot.dialog('/', intents);

// This will execute whenever input does not match an intent
intents.onDefault([
    (session, result, next) => {
        // Have a way to distinguish between the user and call center
        // Any user in skype is the call center in this example
        if (session.message.address.channelId !== 'skype') {
            session.privateConversationData['isUser'] = 'yes';
            session.userData.name = '';
        }
        // if user is not call center and is not yet connected to a call center
        if (session.privateConversationData.isUser && !session.privateConversationData.contactInfo) {
            session.send('Type \'help\' to get help or \'greet\' to be greeted');
        }
        // This is where a call center adds itself to the persistance level and is set to available
        if (!session.privateConversationData.isUser && !session.privateConversationData.contactInfo) {
            storage.addCallCenter(session.message.address);
            // instructions for call center
            session.send('If you receive \'I would like some help\' type \'help\' to connect to a user ');
        }
    },
]);

// Add intent handlers
intents.matches(/^help/i, [
    (session, args, next) => {
        // Find an available person to talk to user
        if (session.privateConversationData.isUser) {
            storage.findCallCenter(session.message.address, (callCenterAddress) => {
                // save the contact address for the call center user will talk to
                let contactInfo = JSON.parse(callCenterAddress._);
                session.privateConversationData['contactInfo'] = contactInfo;
                session.message.text = 'I would like some help.';
                // move to a conversation where messages will be passed between user and call center
                session.replaceDialog('/userConversation');
            });
        }
        else {
            // When a user connects to a call center, here is where call center connects to the user

            storage.connectToUser(session.message.address.conversation.id, (connectedUser) => {
                session.privateConversationData['contactInfo'] = connectedUser;
                // This will be sent to user
                session.send('Messages will be sent to user. Type \'break\' to disconnect');
                session.message.text = 'Hi! How Can I Help You?';
                session.replaceDialog('/callCenterConversation');
            });
        }
    }
]);

bot.dialog('/userConversation', [
    (session, results, next) => {
        // Give user a way out of the conversation
        // Stay in this loop until disconnected, bot.send does not advance waterfall
        // this works like an infinite loop to send all user messages to call center
        bot.send(
            new builder.Message()
                .text(session.message.text)
                .address(session.privateConversationData.contactInfo));
    }
]);

bot.dialog('/userDisconnect', (session, args) => {
    session.privateConversationData['contactInfo'] = '';
    // delete session.privateConversationData.contactInfo;
    session.replaceDialog('/');
});

bot.dialog('/callCenterConversation', [
    (session, result) => {
        // if call center wants to end conversation type break
        if (session.message.text === 'break') {
            // send last message to user to disconnect
            bot.send(new builder.Message()
                .text('Thank you for letting us help')
                .address(session.privateConversationData.contactInfo));
            // Pass call center information remove contact information and reset to status to available
            storage.disconnectFromUser(session.message.address);
            // remove contact information to go back into circulation ready for another user
            session.privateConversationData['contactInfo'] = '';
            session.send('Ending Dialog and Removing contact information for user. Ready to talk to another client');
            session.endDialog();
        } else {
            // bot.send does not advance dialogs
            // this works like an infinite loop to send all messages not matching 'break' to user
            bot.send(
                new builder.Message()
                    .text(session.message.text)
                    .address(session.privateConversationData.contactInfo));
        }
    }
]);

// A simple example from existing Microsoft Bot Framework Sample code
// included to show Bot this bot work outside of talking between users
intents.matches(/^greet/i, [
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