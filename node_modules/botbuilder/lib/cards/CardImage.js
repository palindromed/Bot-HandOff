"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Message_1 = require("../Message");
var CardImage = (function () {
    function CardImage(session) {
        this.session = session;
        this.data = {};
    }
    CardImage.prototype.url = function (u) {
        if (u) {
            this.data.url = u;
        }
        return this;
    };
    CardImage.prototype.alt = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.alt = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    CardImage.prototype.tap = function (action) {
        if (action) {
            this.data.tap = action.toAction ? action.toAction() : action;
        }
        return this;
    };
    CardImage.prototype.toImage = function () {
        return this.data;
    };
    CardImage.create = function (session, url) {
        return new CardImage(session).url(url);
    };
    return CardImage;
}());
exports.CardImage = CardImage;
