var express = require('express');
var builder = require('botbuilder');
var app = express();
require('./globals.js')();
var middleware = require('./middleware.js');

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

//========================================================
// Bot Middleware
//========================================================
bot.use(
    {
        send: function (event, next) {
            event = middleware.outgoing(event, 'send');
            next();
        },
        receive: function (event, next) {
            event = middleware.incoming(event, 'receive');
            next();
        }
    });


//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session, args, next) {
        session.send('Echo ' + session.message.text);
    }]);