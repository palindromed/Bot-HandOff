"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Message_1 = require("../Message");
var ReceiptCard = (function () {
    function ReceiptCard(session) {
        this.session = session;
        this.data = {
            contentType: 'application/vnd.microsoft.card.receipt',
            content: {}
        };
    }
    ReceiptCard.prototype.title = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.content.title = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    ReceiptCard.prototype.items = function (list) {
        this.data.content.items = [];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                this.data.content.items.push(item.toItem ? item.toItem() : item);
            }
        }
        return this;
    };
    ReceiptCard.prototype.facts = function (list) {
        this.data.content.facts = [];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                var fact = list[i];
                this.data.content.facts.push(fact.toFact ? fact.toFact() : fact);
            }
        }
        return this;
    };
    ReceiptCard.prototype.tap = function (action) {
        if (action) {
            this.data.content.tap = action.toAction ? action.toAction() : action;
        }
        return this;
    };
    ReceiptCard.prototype.total = function (v) {
        this.data.content.total = v || '';
        return this;
    };
    ReceiptCard.prototype.tax = function (v) {
        this.data.content.tax = v || '';
        return this;
    };
    ReceiptCard.prototype.vat = function (v) {
        this.data.content.vat = v || '';
        return this;
    };
    ReceiptCard.prototype.buttons = function (list) {
        this.data.content.buttons = [];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                var action = list[i];
                this.data.content.buttons.push(action.toAction ? action.toAction() : action);
            }
        }
        return this;
    };
    ReceiptCard.prototype.toAttachment = function () {
        return this.data;
    };
    return ReceiptCard;
}());
exports.ReceiptCard = ReceiptCard;
var ReceiptItem = (function () {
    function ReceiptItem(session) {
        this.session = session;
        this.data = {};
    }
    ReceiptItem.prototype.title = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.title = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    ReceiptItem.prototype.subtitle = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.subtitle = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    ReceiptItem.prototype.text = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.text = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    ReceiptItem.prototype.image = function (img) {
        if (img) {
            this.data.image = img.toImage ? img.toImage() : img;
        }
        return this;
    };
    ReceiptItem.prototype.price = function (v) {
        this.data.price = v || '';
        return this;
    };
    ReceiptItem.prototype.quantity = function (v) {
        this.data.quantity = v || '';
        return this;
    };
    ReceiptItem.prototype.tap = function (action) {
        if (action) {
            this.data.tap = action.toAction ? action.toAction() : action;
        }
        return this;
    };
    ReceiptItem.prototype.toItem = function () {
        return this.data;
    };
    ReceiptItem.create = function (session, price, title) {
        return new ReceiptItem(session).price(price).title(title);
    };
    return ReceiptItem;
}());
exports.ReceiptItem = ReceiptItem;
var Fact = (function () {
    function Fact(session) {
        this.session = session;
        this.data = { value: '' };
    }
    Fact.prototype.key = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.key = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    Fact.prototype.value = function (v) {
        this.data.value = v || '';
        return this;
    };
    Fact.prototype.toFact = function () {
        return this.data;
    };
    Fact.create = function (session, value, key) {
        return new Fact(session).value(value).key(key);
    };
    return Fact;
}());
exports.Fact = Fact;
