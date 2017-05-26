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
var MediaCard_1 = require("./MediaCard");
var VideoCard = (function (_super) {
    __extends(VideoCard, _super);
    function VideoCard(session) {
        var _this = _super.call(this, session) || this;
        _this.data.contentType = 'application/vnd.microsoft.card.video';
        return _this;
    }
    VideoCard.prototype.aspect = function (text) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (text) {
            this.data.content.aspect = Message_1.fmtText(this.session, text, args);
        }
        return this;
    };
    return VideoCard;
}(MediaCard_1.MediaCard));
exports.VideoCard = VideoCard;
