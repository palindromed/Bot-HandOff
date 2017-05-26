"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Message_1 = require("../Message");
var CardAction = (function () {
    function CardAction(session) {
        this.session = session;
        this.data = {};
    }
    CardAction.prototype.type = function (t) {
        if (t) {
            this.data.type = t;
        }
        return this;
    };
    CardAction.prototype.title = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.title = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    CardAction.prototype.value = function (v) {
        if (v) {
            this.data.value = v;
        }
        return this;
    };
    CardAction.prototype.image = function (url) {
        if (url) {
            this.data.image = url;
        }
        return this;
    };
    CardAction.prototype.toAction = function () {
        return this.data;
    };
    CardAction.call = function (session, number, title) {
        return new CardAction(session).type('call').value(number).title(title || "Click to call");
    };
    CardAction.openUrl = function (session, url, title) {
        return new CardAction(session).type('openUrl').value(url).title(title || "Click to open website in your browser");
    };
    CardAction.imBack = function (session, msg, title) {
        return new CardAction(session).type('imBack').value(msg).title(title || "Click to send response to bot");
    };
    CardAction.postBack = function (session, msg, title) {
        return new CardAction(session).type('postBack').value(msg).title(title || "Click to send response to bot");
    };
    CardAction.playAudio = function (session, url, title) {
        return new CardAction(session).type('playAudio').value(url).title(title || "Click to play audio file");
    };
    CardAction.playVideo = function (session, url, title) {
        return new CardAction(session).type('playVideo').value(url).title(title || "Click to play video");
    };
    CardAction.showImage = function (session, url, title) {
        return new CardAction(session).type('showImage').value(url).title(title || "Click to view image");
    };
    CardAction.downloadFile = function (session, url, title) {
        return new CardAction(session).type('downloadFile').value(url).title(title || "Click to download file");
    };
    CardAction.dialogAction = function (session, action, data, title) {
        var value = 'action?' + action;
        if (data) {
            value += '=' + data;
        }
        return new CardAction(session).type('postBack').value(value).title(title || "Click to send response to bot");
    };
    return CardAction;
}());
exports.CardAction = CardAction;
