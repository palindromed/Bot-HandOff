"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var WaterfallDialog_1 = require("./WaterfallDialog");
var DialogAction_1 = require("./DialogAction");
var Dialog_1 = require("./Dialog");
var IntentRecognizerSet_1 = require("./IntentRecognizerSet");
var RegExpRecognizer_1 = require("./RegExpRecognizer");
var Message_1 = require("../Message");
var consts = require("../consts");
var PromptType;
(function (PromptType) {
    PromptType[PromptType["text"] = 0] = "text";
    PromptType[PromptType["number"] = 1] = "number";
    PromptType[PromptType["confirm"] = 2] = "confirm";
    PromptType[PromptType["choice"] = 3] = "choice";
    PromptType[PromptType["time"] = 4] = "time";
    PromptType[PromptType["attachment"] = 5] = "attachment";
})(PromptType = exports.PromptType || (exports.PromptType = {}));
var ListStyle;
(function (ListStyle) {
    ListStyle[ListStyle["none"] = 0] = "none";
    ListStyle[ListStyle["inline"] = 1] = "inline";
    ListStyle[ListStyle["list"] = 2] = "list";
    ListStyle[ListStyle["button"] = 3] = "button";
    ListStyle[ListStyle["auto"] = 4] = "auto";
})(ListStyle = exports.ListStyle || (exports.ListStyle = {}));
var Prompt = (function (_super) {
    __extends(Prompt, _super);
    function Prompt(features) {
        var _this = _super.call(this) || this;
        _this.features = features;
        _this.recognizers = new IntentRecognizerSet_1.IntentRecognizerSet();
        _this.handlers = {};
        _this._onPrompt = [];
        _this._onFormatMessage = [];
        _this._onRecognize = [];
        if (!_this.features) {
            _this.features = {};
        }
        return _this;
    }
    Prompt.prototype.begin = function (session, options) {
        var dc = session.dialogData;
        dc.options = options || {};
        dc.turns = 0;
        dc.lastTurn = new Date().getTime();
        dc.isReprompt = false;
        if (!options.hasOwnProperty('promptAfterAction')) {
            options.promptAfterAction = true;
        }
        function resolvePrompt(prompt) {
            if (typeof prompt == 'object' && prompt.toMessage) {
                return prompt.toMessage();
            }
            return prompt;
        }
        options.prompt = resolvePrompt(options.prompt);
        options.retryPrompt = resolvePrompt(options.retryPrompt);
        if (!options.libraryNamespace) {
            if (options.localizationNamespace) {
                options.libraryNamespace = options.localizationNamespace;
            }
            else {
                var stack = session.dialogStack();
                if (stack.length >= 2) {
                    options.libraryNamespace = stack[stack.length - 2].id.split(':')[0];
                }
                else {
                    options.libraryNamespace = consts.Library.default;
                }
            }
        }
        var attachments = options.attachments || [];
        for (var i = 0; i < attachments.length; i++) {
            if (attachments[i].toAttachment) {
                attachments[i] = attachments[i].toAttachment();
            }
        }
        this.sendPrompt(session);
    };
    Prompt.prototype.recognize = function (context, cb) {
        var dc = context.dialogData;
        dc.turns++;
        dc.lastTurn = new Date().getTime();
        dc.isReprompt = false;
        dc.activeIntent = null;
        var recognizers = this.recognizers;
        function finalRecognize() {
            recognizers.recognize(context, function (err, r) {
                if (!err && r.score > result.score) {
                    result = r;
                }
                cb(err, result);
            });
        }
        var idx = 0;
        var handlers = this._onRecognize;
        var result = context.intent || { score: 0.0, intent: null };
        function next() {
            try {
                if (idx < handlers.length) {
                    handlers[idx++](context, function (err, score, response) {
                        if (err) {
                            return cb(err, null);
                        }
                        var r = {
                            score: score,
                            intent: consts.Intents.Response,
                            entities: [{
                                    type: consts.Entities.Response,
                                    entity: response
                                }]
                        };
                        if (r.score > result.score) {
                            result = r;
                        }
                        if (result.score >= 1.0) {
                            cb(null, result);
                        }
                        else {
                            next();
                        }
                    });
                }
                else {
                    finalRecognize();
                }
            }
            catch (e) {
                cb(e, null);
            }
        }
        next();
    };
    Prompt.prototype.replyReceived = function (session, recognizeResult) {
        if (recognizeResult && recognizeResult.score > 0.0) {
            this.invokeIntent(session, recognizeResult);
        }
        else {
            this.sendPrompt(session);
        }
    };
    Prompt.prototype.dialogResumed = function (session, result) {
        var dc = session.dialogData;
        if (dc.activeIntent && this.handlers.hasOwnProperty(dc.activeIntent)) {
            try {
                this.handlers[dc.activeIntent](session, result);
            }
            catch (e) {
                session.error(e);
            }
        }
        else if (dc.options.promptAfterAction) {
            dc.isReprompt = (result.resumed === Dialog_1.ResumeReason.reprompt);
            this.sendPrompt(session);
        }
    };
    Prompt.prototype.sendPrompt = function (session) {
        var _that = this;
        function defaultSend() {
            if (typeof options.maxRetries === 'number' && turns > options.maxRetries) {
                session.endDialogWithResult({ resumed: Dialog_1.ResumeReason.notCompleted });
            }
            else {
                var prompt_1 = turns > 0 ? _that.getRetryPrompt(session) : options.prompt;
                if (Array.isArray(prompt_1) || typeof prompt_1 === 'string') {
                    var speak = turns > 0 ? options.retrySpeak : options.speak;
                    _that.formatMessage(session, prompt_1, speak, function (err, msg) {
                        if (!err) {
                            sendMsg(msg);
                        }
                        else {
                            session.error(err);
                        }
                    });
                }
                else {
                    sendMsg(prompt_1);
                }
            }
        }
        function sendMsg(msg) {
            if (turns == 0) {
                if (options.attachments) {
                    if (!msg.attachments) {
                        msg.attachments = [];
                    }
                    options.attachments.forEach(function (value) {
                        if (value.toAttachment) {
                            msg.attachments.push(value.toAttachment());
                        }
                        else {
                            msg.attachments.push(value);
                        }
                    });
                }
                ['attachmentLayout', 'entities', 'textFormat', 'inputHint'].forEach(function (key) {
                    if (!msg.hasOwnProperty(key)) {
                        msg[key] = options[key];
                    }
                });
            }
            if (!msg.inputHint) {
                msg.inputHint = Message_1.InputHint.expectingInput;
            }
            session.send(msg);
        }
        var idx = 0;
        var handlers = this._onPrompt;
        var turns = session.dialogData.turns;
        var options = session.dialogData.options;
        function next() {
            try {
                if (idx < handlers.length) {
                    handlers[idx++](session, next);
                }
                else {
                    defaultSend();
                }
            }
            catch (e) {
                session.error(e);
            }
        }
        next();
    };
    Prompt.prototype.formatMessage = function (session, text, speak, callback) {
        var idx = 0;
        var handlers = this._onFormatMessage;
        function next(err, msg) {
            if (err || msg) {
                callback(err, msg);
            }
            else {
                try {
                    if (idx < handlers.length) {
                        handlers[idx++](session, text, speak, next);
                    }
                    else {
                        msg = { text: Prompt.gettext(session, text) };
                        if (speak) {
                            msg.speak = Prompt.gettext(session, speak);
                        }
                        callback(null, msg);
                    }
                }
                catch (e) {
                    callback(e, null);
                }
            }
        }
        next(null, null);
    };
    Prompt.prototype.onPrompt = function (handler) {
        this._onPrompt.unshift(handler);
        return this;
    };
    Prompt.prototype.onFormatMessage = function (handler) {
        this._onFormatMessage.unshift(handler);
        return this;
    };
    Prompt.prototype.onRecognize = function (handler) {
        this._onRecognize.unshift(handler);
        return this;
    };
    Prompt.prototype.matches = function (intent, dialogId, dialogArgs) {
        var id;
        if (intent) {
            if (typeof intent === 'string') {
                id = intent;
            }
            else {
                id = intent.toString();
                this.recognizers.recognizer(new RegExpRecognizer_1.RegExpRecognizer(id, intent));
            }
        }
        if (Array.isArray(dialogId)) {
            this.handlers[id] = WaterfallDialog_1.WaterfallDialog.createHandler(dialogId);
        }
        else if (typeof dialogId === 'string') {
            this.handlers[id] = DialogAction_1.DialogAction.beginDialog(dialogId, dialogArgs);
        }
        else {
            this.handlers[id] = WaterfallDialog_1.WaterfallDialog.createHandler([dialogId]);
        }
        return this;
    };
    Prompt.prototype.matchesAny = function (intents, dialogId, dialogArgs) {
        for (var i = 0; i < intents.length; i++) {
            this.matches(intents[i], dialogId, dialogArgs);
        }
        return this;
    };
    Prompt.prototype.recognizer = function (plugin) {
        this.recognizers.recognizer(plugin);
        return this;
    };
    Prompt.prototype.updateFeatures = function (features) {
        if (features) {
            for (var key in features) {
                if (features.hasOwnProperty(key)) {
                    this.features[key] = features[key];
                }
            }
        }
        return this;
    };
    Prompt.gettext = function (session, text, namespace) {
        var locale = session.preferredLocale();
        var options = session.dialogData.options;
        if (!namespace && options && options.libraryNamespace) {
            namespace = options.libraryNamespace;
        }
        return session.localizer.gettext(locale, Message_1.Message.randomPrompt(text), namespace);
    };
    Prompt.prototype.invokeIntent = function (session, recognizeResult) {
        if (recognizeResult.intent === consts.Intents.Response) {
            var response = recognizeResult.entities && recognizeResult.entities.length == 1 ? recognizeResult.entities[0].entity : null;
            session.logger.log(session.dialogStack(), 'Prompt.returning(' + response + ')');
            session.endDialogWithResult({ resumed: Dialog_1.ResumeReason.completed, response: response });
        }
        else if (this.handlers.hasOwnProperty(recognizeResult.intent)) {
            try {
                session.logger.log(session.dialogStack(), 'Prompt.matches(' + recognizeResult.intent + ')');
                var dc = session.dialogData;
                dc.activeIntent = recognizeResult.intent;
                this.handlers[dc.activeIntent](session, recognizeResult);
            }
            catch (e) {
                session.error(e);
            }
        }
        else {
            session.logger.warn(session.dialogStack(), 'Prompt - no intent handler found for ' + recognizeResult.intent);
            this.sendPrompt(session);
        }
    };
    Prompt.prototype.getRetryPrompt = function (session) {
        var options = session.dialogData.options;
        if (options.retryPrompt) {
            return options.retryPrompt;
        }
        else if (this.features.defaultRetryPrompt) {
            var prompt_2 = this.features.defaultRetryPrompt;
            if (Array.isArray(prompt_2) || typeof prompt_2 === 'string') {
                var locale = session.preferredLocale();
                return session.localizer.gettext(locale, Message_1.Message.randomPrompt(prompt_2), this.features.defaultRetryNamespace || consts.Library.default);
            }
            else {
                return prompt_2;
            }
        }
        else {
            return options.prompt;
        }
    };
    return Prompt;
}(Dialog_1.Dialog));
exports.Prompt = Prompt;
var prompt = new Prompt({});
