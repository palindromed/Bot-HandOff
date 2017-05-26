"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CardMedia = (function () {
    function CardMedia(session) {
        this.session = session;
        this.data = {};
    }
    CardMedia.prototype.url = function (u) {
        if (u) {
            this.data.url = u;
        }
        return this;
    };
    CardMedia.prototype.profile = function (text) {
        if (text) {
            this.data.profile = text;
        }
        return this;
    };
    CardMedia.prototype.toMedia = function () {
        return this.data;
    };
    CardMedia.create = function (session, url) {
        return new CardMedia(session).url(url);
    };
    return CardMedia;
}());
exports.CardMedia = CardMedia;
