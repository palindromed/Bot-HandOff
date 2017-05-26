"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Keyboard = (function () {
    function Keyboard(session) {
        this.session = session;
        this.data = {
            contentType: 'application/vnd.microsoft.keyboard',
            content: {}
        };
    }
    Keyboard.prototype.buttons = function (list) {
        this.data.content.buttons = [];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                var action = list[i];
                this.data.content.buttons.push(action.toAction ? action.toAction() : action);
            }
        }
        return this;
    };
    Keyboard.prototype.toAttachment = function () {
        return this.data;
    };
    return Keyboard;
}());
exports.Keyboard = Keyboard;
