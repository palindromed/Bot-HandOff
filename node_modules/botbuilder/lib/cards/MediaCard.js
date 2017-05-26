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
var Message_1 = require("../Message");
var Keyboard_1 = require("./Keyboard");
var MediaCard = (function (_super) {
    __extends(MediaCard, _super);
    function MediaCard(session) {
        return _super.call(this, session) || this;
    }
    MediaCard.prototype.title = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.content.title = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    MediaCard.prototype.subtitle = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.content.subtitle = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    MediaCard.prototype.text = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.content.text = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    MediaCard.prototype.autoloop = function (choice) {
        this.data.content.autoloop = choice;
        return this;
    };
    MediaCard.prototype.autostart = function (choice) {
        this.data.content.autostart = choice;
        return this;
    };
    MediaCard.prototype.shareable = function (choice) {
        this.data.content.shareable = choice;
        return this;
    };
    MediaCard.prototype.image = function (image) {
        if (image) {
            this.data.content.image = image.toImage ? image.toImage() : image;
        }
        return this;
    };
    MediaCard.prototype.media = function (list) {
        this.data.content.media = [];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                var media = list[i];
                this.data.content.media.push(media.toMedia ? media.toMedia() : media);
            }
        }
        return this;
    };
    return MediaCard;
}(Keyboard_1.Keyboard));
exports.MediaCard = MediaCard;
