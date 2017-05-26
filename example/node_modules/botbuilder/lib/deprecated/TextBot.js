"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UniversalBot_1 = require("../bots/UniversalBot");
var ConsoleConnector_1 = require("../bots/ConsoleConnector");
var TextBot = (function () {
    function TextBot(options) {
        if (options === void 0) { options = {}; }
        console.warn('TextBot class is deprecated. Use UniversalBot with a ConsoleConnector class.');
        var oBot = {};
        for (var key in options) {
            switch (key) {
                case 'defaultDialogId':
                    oBot.defaultDialogId = options.defaultDialogId;
                    break;
                case 'defaultDialogArgs':
                    oBot.defaultDialogArgs = options.defaultDialogArgs;
                    break;
                case 'groupWelcomeMessage':
                    this.groupWelcomeMessage = options.groupWelcomeMessage;
                    break;
                case 'userWelcomeMessage':
                    this.userWelcomeMessage = options.userWelcomeMessage;
                    break;
                case 'goodbyeMessage':
                    this.goodbyeMessage = options.goodbyeMessage;
                    break;
                case 'userStore':
                case 'sessionStore':
                    console.error('TextBot custom stores no longer supported. Use UniversalBot with a custom IBotStorage implementation instead.');
                    throw new Error('TextBot custom stores no longer supported.');
            }
        }
        this.connector = new ConsoleConnector_1.ConsoleConnector();
        this.bot = new UniversalBot_1.UniversalBot(this.connector, oBot);
    }
    TextBot.prototype.on = function (event, listener) {
        this.bot.on(event, listener);
        return this;
    };
    TextBot.prototype.add = function (id, dialog) {
        this.bot.dialog(id, dialog);
        return this;
    };
    TextBot.prototype.configure = function (options) {
        console.error("TextBot.configure() is no longer supported. You should either pass all options into the constructor or update code to use the new UniversalBot class.");
        throw new Error("TextBot.configure() is no longer supported.");
    };
    TextBot.prototype.listenStdin = function () {
        return this.connector.listen();
    };
    TextBot.prototype.beginDialog = function (address, dialogId, dialogArgs) {
        console.error("TextBot.beginDialog() is no longer supported. The schema for sending proactive messages has changed and you should update your code to use the new UniversalBot class.");
        throw new Error("TextBot.beginDialog() is no longer supported.");
    };
    TextBot.prototype.processMessage = function (message, callback) {
        console.error("TextBot.processMessage() is no longer supported. The schema for messages has changed and you should update your code to use the new UniversalBot class.");
        throw new Error("TextBot.processMessage() is no longer supported.");
    };
    return TextBot;
}());
exports.TextBot = TextBot;
