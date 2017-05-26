"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HeroCard_1 = require("./cards/HeroCard");
var CardImage_1 = require("./cards/CardImage");
var CardAction_1 = require("./cards/CardAction");
var utils = require("./utils");
var consts = require("./consts");
var sprintf = require("sprintf-js");
exports.TextFormat = {
    plain: 'plain',
    markdown: 'markdown',
    xml: 'xml'
};
exports.AttachmentLayout = {
    list: 'list',
    carousel: 'carousel'
};
exports.InputHint = {
    acceptingInput: 'acceptingInput',
    ignoringInput: 'ignoringInput',
    expectingInput: 'expectingInput'
};
var Message = (function () {
    function Message(session) {
        this.session = session;
        this.data = {};
        this.data.type = consts.messageType;
        this.data.agent = consts.agent;
        if (this.session) {
            var m = this.session.message;
            if (m.source) {
                this.data.source = m.source;
            }
            if (m.textLocale) {
                this.data.textLocale = m.textLocale;
            }
            if (m.address) {
                this.data.address = m.address;
            }
        }
    }
    Message.prototype.inputHint = function (hint) {
        this.data.inputHint = hint;
        return this;
    };
    Message.prototype.speak = function (ssml) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (ssml) {
            this.data.speak = fmtText(this.session, ssml, args);
        }
        return this;
    };
    Message.prototype.nspeak = function (ssml, ssml_plural, count) {
        var fmt = count == 1 ? Message.randomPrompt(ssml) : Message.randomPrompt(ssml_plural);
        if (this.session) {
            fmt = this.session.gettext(fmt);
        }
        this.data.speak = sprintf.sprintf(fmt, count);
        return this;
    };
    Message.prototype.textLocale = function (locale) {
        this.data.textLocale = locale;
        return this;
    };
    Message.prototype.textFormat = function (style) {
        this.data.textFormat = style;
        return this;
    };
    Message.prototype.text = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.text = text ? fmtText(this.session, text, args) : '';
        }
        return this;
    };
    Message.prototype.ntext = function (msg, msg_plural, count) {
        var fmt = count == 1 ? Message.randomPrompt(msg) : Message.randomPrompt(msg_plural);
        if (this.session) {
            fmt = this.session.gettext(fmt);
        }
        this.data.text = sprintf.sprintf(fmt, count);
        return this;
    };
    Message.prototype.compose = function (prompts) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (prompts) {
            this.data.text = Message.composePrompt(this.session, prompts, args);
        }
        return this;
    };
    Message.prototype.summary = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.data.summary = text ? fmtText(this.session, text, args) : '';
        return this;
    };
    Message.prototype.attachmentLayout = function (style) {
        this.data.attachmentLayout = style;
        return this;
    };
    Message.prototype.attachments = function (list) {
        this.data.attachments = [];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                this.addAttachment(list[i]);
            }
        }
        return this;
    };
    Message.prototype.addAttachment = function (attachment) {
        if (attachment) {
            var a = attachment.toAttachment ? attachment.toAttachment() : attachment;
            a = this.upgradeAttachment(a);
            if (!this.data.attachments) {
                this.data.attachments = [a];
            }
            else {
                this.data.attachments.push(a);
            }
        }
        return this;
    };
    Message.prototype.suggestedActions = function (suggestedActions) {
        if (suggestedActions) {
            var actions = suggestedActions.toSuggestedActions
                ? suggestedActions.toSuggestedActions()
                : suggestedActions;
            this.data.suggestedActions = actions;
        }
        return this;
    };
    Message.prototype.entities = function (list) {
        this.data.entities = list || [];
        return this;
    };
    Message.prototype.addEntity = function (obj) {
        if (obj) {
            if (!this.data.entities) {
                this.data.entities = [obj];
            }
            else {
                this.data.entities.push(obj);
            }
        }
        return this;
    };
    Message.prototype.address = function (adr) {
        if (adr) {
            this.data.address = adr;
            this.data.source = adr.channelId;
        }
        return this;
    };
    Message.prototype.timestamp = function (time) {
        if (this.session) {
            this.session.logger.warn(this.session.dialogStack(), "Message.timestamp() should be set by the connectors service. Use Message.localTimestamp() instead.");
        }
        this.data.timestamp = time || new Date().toISOString();
        return this;
    };
    Message.prototype.localTimestamp = function (time) {
        this.data.localTimestamp = time || new Date().toISOString();
        return this;
    };
    Message.prototype.sourceEvent = function (map) {
        if (map) {
            var channelId = this.data.address ? this.data.address.channelId : '*';
            if (map.hasOwnProperty(channelId)) {
                this.data.sourceEvent = map[channelId];
            }
            else if (map.hasOwnProperty('*')) {
                this.data.sourceEvent = map['*'];
            }
        }
        return this;
    };
    Message.prototype.toMessage = function () {
        return utils.clone(this.data);
    };
    Message.prototype.upgradeAttachment = function (a) {
        var isOldSchema = false;
        for (var prop in a) {
            switch (prop) {
                case 'actions':
                case 'fallbackText':
                case 'title':
                case 'titleLink':
                case 'text':
                case 'thumbnailUrl':
                    isOldSchema = true;
                    break;
            }
        }
        if (isOldSchema) {
            console.warn('Using old attachment schema. Upgrade to new card schema.');
            var v2 = a;
            var card = new HeroCard_1.HeroCard();
            if (v2.title) {
                card.title(v2.title);
            }
            if (v2.text) {
                card.text(v2.text);
            }
            if (v2.thumbnailUrl) {
                card.images([new CardImage_1.CardImage().url(v2.thumbnailUrl)]);
            }
            if (v2.titleLink) {
                card.tap(CardAction_1.CardAction.openUrl(null, v2.titleLink));
            }
            if (v2.actions) {
                var list = [];
                for (var i = 0; i < v2.actions.length; i++) {
                    var old = v2.actions[i];
                    var btn = old.message ?
                        CardAction_1.CardAction.imBack(null, old.message, old.title) :
                        CardAction_1.CardAction.openUrl(null, old.url, old.title);
                    if (old.image) {
                        btn.image(old.image);
                    }
                    list.push(btn);
                }
                card.buttons(list);
            }
            return card.toAttachment();
        }
        else {
            return a;
        }
    };
    Message.randomPrompt = function (prompts) {
        if (Array.isArray(prompts)) {
            var i = Math.floor(Math.random() * prompts.length);
            return prompts[i];
        }
        else {
            return prompts;
        }
    };
    Message.composePrompt = function (session, prompts, args) {
        var connector = '';
        var prompt = '';
        for (var i = 0; i < prompts.length; i++) {
            var txt = Message.randomPrompt(prompts[i]);
            prompt += connector + (session ? session.gettext(txt) : txt);
            connector = ' ';
        }
        return args && args.length > 0 ? sprintf.vsprintf(prompt, args) : prompt;
    };
    Message.prototype.setLanguage = function (local) {
        console.warn("Message.setLanguage() is deprecated. Use Message.textLocal() instead.");
        return this.textLocale(local);
    };
    Message.prototype.setText = function (session, prompts) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        console.warn("Message.setText() is deprecated. Use Message.text() instead.");
        if (session && !this.session) {
            this.session = session;
        }
        args.unshift(prompts);
        return Message.prototype.text.apply(this, args);
    };
    Message.prototype.setNText = function (session, msg, msg_plural, count) {
        console.warn("Message.setNText() is deprecated. Use Message.ntext() instead.");
        if (session && !this.session) {
            this.session = session;
        }
        return this.ntext(msg, msg_plural, count);
    };
    Message.prototype.composePrompt = function (session, prompts) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        console.warn("Message.composePrompt() is deprecated. Use Message.compose() instead.");
        if (session && !this.session) {
            this.session = session;
        }
        args.unshift(prompts);
        return Message.prototype.compose.apply(this, args);
    };
    Message.prototype.setChannelData = function (data) {
        console.warn("Message.setChannelData() is deprecated. Use Message.sourceEvent() instead.");
        return this.sourceEvent({ '*': data });
    };
    return Message;
}());
exports.Message = Message;
function fmtText(session, prompts, args) {
    var fmt = Message.randomPrompt(prompts);
    if (session) {
        fmt = session.gettext(fmt);
    }
    return args && args.length > 0 ? sprintf.vsprintf(fmt, args) : fmt;
}
exports.fmtText = fmtText;
