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
var ThumbnailCard = (function (_super) {
    __extends(ThumbnailCard, _super);
    function ThumbnailCard(session) {
        var _this = _super.call(this, session) || this;
        _this.data.contentType = 'application/vnd.microsoft.card.thumbnail';
        return _this;
    }
    ThumbnailCard.prototype.title = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.content.title = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    ThumbnailCard.prototype.subtitle = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.content.subtitle = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    ThumbnailCard.prototype.text = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.content.text = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    ThumbnailCard.prototype.images = function (list) {
        this.data.content.images = [];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                var image = list[i];
                this.data.content.images.push(image.toImage ? image.toImage() : image);
            }
        }
        return this;
    };
    ThumbnailCard.prototype.tap = function (action) {
        if (action) {
            this.data.content.tap = action.toAction ? action.toAction() : action;
        }
        return this;
    };
    return ThumbnailCard;
}(Keyboard_1.Keyboard));
exports.ThumbnailCard = ThumbnailCard;
