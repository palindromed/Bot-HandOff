"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SimpleDialog_1 = require("./SimpleDialog");
var DialogAction_1 = require("./DialogAction");
var Dialog_1 = require("./Dialog");
var IntentRecognizerSet_1 = require("./IntentRecognizerSet");
var RegExpRecognizer_1 = require("./RegExpRecognizer");
var Message_1 = require("../Message");
var consts = require("../consts");
var InputDialog = (function (_super) {
    __extends(InputDialog, _super);
    function InputDialog() {
        var _this = _super.apply(this, arguments) || this;
        _this.recognizers = new IntentRecognizerSet_1.IntentRecognizerSet();
        _this.handlers = {};
        _this._onPrompt = [];
        _this._onFormatMessage = [];
        _this._onRecognize = [];
        return _this;
    }
    InputDialog.prototype.begin = function (session, args) {
        var dc = session.dialogData;
        dc.args = args || {};
        dc.turns = 0;
        dc.lastTurn = new Date().getTime();
        dc.isReprompt = false;
        if (!dc.args.hasOwnProperty('promptAfterAction')) {
            dc.args.promptAfterAction = true;
        }
        this.sendPrompt(session);
    };
    InputDialog.prototype.recognize = function (context, cb) {
        var dc = context.dialogData;
        dc.turns++;
        dc.lastTurn = new Date().getTime();
        dc.isReprompt = false;
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
    InputDialog.prototype.replyReceived = function (session, recognizeResult) {
        if (recognizeResult && recognizeResult.score > 0.0) {
            this.invokeIntent(session, recognizeResult);
        }
        else {
            this.sendPrompt(session);
        }
    };
    InputDialog.prototype.dialogResumed = function (session, result) {
        var dc = session.dialogData;
        if (dc.activeIntent && this.handlers.hasOwnProperty(dc.activeIntent)) {
            try {
                this.handlers[dc.activeIntent](session, result);
            }
            catch (e) {
                session.error(e);
            }
        }
        else if (dc.args.promptAfterAction) {
            dc.isReprompt = (result.resumed === Dialog_1.ResumeReason.reprompt);
            this.sendPrompt(session);
        }
    };
    InputDialog.prototype.sendPrompt = function (session) {
        var _that = this;
        function defaultSend() {
            var turns = session.dialogData.turns;
            var args = session.dialogData.args;
            var retryPrompt = args.retryPrompt || _that._defaultRetryPrompt || args.prompt;
            if (typeof args.maxRetries === 'number' && turns > args.maxRetries) {
                session.endDialogWithResult({ resumed: Dialog_1.ResumeReason.notCompleted });
            }
            else {
                var prompt_1 = turns > 0 ? retryPrompt : args.prompt;
                if (Array.isArray(prompt_1) || typeof prompt_1 === 'string') {
                    var speak = turns > 0 ? args.retrySpeak : args.speak;
                    _that.formatMessage(session, prompt_1, speak, function (err, msg) {
                        if (!err) {
                            session.send(msg);
                        }
                        else {
                            session.error(err);
                        }
                    });
                }
                else {
                    session.send(prompt_1);
                }
            }
        }
        var idx = 0;
        var handlers = this._onPrompt;
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
    InputDialog.prototype.formatMessage = function (session, text, speak, callback) {
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
                        var locale = session.preferredLocale();
                        var namespace = session.dialogData.args.localizationNamespace;
                        msg = { text: session.localizer.gettext(locale, Message_1.Message.randomPrompt(text), namespace) };
                        if (speak) {
                            msg.speak = session.localizer.gettext(locale, Message_1.Message.randomPrompt(speak), namespace);
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
    InputDialog.prototype.defaultRetryPrompt = function (prompt) {
        if (prompt) {
            this._defaultRetryPrompt = prompt;
        }
        return this._defaultRetryPrompt;
    };
    InputDialog.prototype.onPrompt = function (handler) {
        this._onPrompt.unshift(handler);
        return this;
    };
    InputDialog.prototype.onFormatMessage = function (handler) {
        this._onFormatMessage.unshift(handler);
        return this;
    };
    InputDialog.prototype.onRecognize = function (handler) {
        this._onRecognize.unshift(handler);
        return this;
    };
    InputDialog.prototype.matches = function (intent, dialogId, dialogArgs) {
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
        if (this.handlers.hasOwnProperty(id)) {
            throw new Error("A handler for '" + id + "' already exists.");
        }
        if (Array.isArray(dialogId)) {
            this.handlers[id] = SimpleDialog_1.createWaterfall(dialogId);
        }
        else if (typeof dialogId === 'string') {
            this.handlers[id] = DialogAction_1.DialogAction.beginDialog(dialogId, dialogArgs);
        }
        else {
            this.handlers[id] = SimpleDialog_1.createWaterfall([dialogId]);
        }
        return this;
    };
    InputDialog.prototype.matchesAny = function (intents, dialogId, dialogArgs) {
        for (var i = 0; i < intents.length; i++) {
            this.matches(intents[i], dialogId, dialogArgs);
        }
        return this;
    };
    InputDialog.prototype.recognizer = function (plugin) {
        this.recognizers.recognizer(plugin);
        return this;
    };
    InputDialog.prototype.invokeIntent = function (session, recognizeResult) {
        if (this.handlers.hasOwnProperty(recognizeResult.intent)) {
            try {
                session.logger.log(session.dialogStack(), 'InputDialog.matches(' + recognizeResult.intent + ')');
                var dc = session.dialogData;
                dc.activeIntent = recognizeResult.intent;
                this.handlers[dc.activeIntent](session, recognizeResult);
            }
            catch (e) {
                session.error(e);
            }
        }
        else {
            session.logger.warn(session.dialogStack(), 'InputDialog - no intent handler found for ' + recognizeResult.intent);
            this.sendPrompt(session);
        }
    };
    return InputDialog;
}(Dialog_1.Dialog));
exports.InputDialog = InputDialog;
