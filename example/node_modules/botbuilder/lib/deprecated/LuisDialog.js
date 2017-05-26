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
var Dialog_1 = require("../dialogs/Dialog");
var IntentDialog_1 = require("../dialogs/IntentDialog");
var LuisRecognizer_1 = require("../dialogs/LuisRecognizer");
var LuisDialog = (function (_super) {
    __extends(LuisDialog, _super);
    function LuisDialog(serviceUri) {
        var _this = _super.call(this) || this;
        console.warn('LuisDialog class is deprecated. Use IntentDialog with a LuisRecognizer instead.');
        var recognizer = new LuisRecognizer_1.LuisRecognizer(serviceUri);
        _this.dialog = new IntentDialog_1.IntentDialog({ recognizers: [recognizer] });
        return _this;
    }
    LuisDialog.prototype.begin = function (session, args) {
        this.dialog.begin(session, args);
    };
    LuisDialog.prototype.replyReceived = function (session, recognizeResult) {
    };
    LuisDialog.prototype.dialogResumed = function (session, result) {
        this.dialog.dialogResumed(session, result);
    };
    LuisDialog.prototype.recognize = function (context, cb) {
        this.dialog.recognize(context, cb);
    };
    LuisDialog.prototype.onBegin = function (handler) {
        this.dialog.onBegin(handler);
        return this;
    };
    LuisDialog.prototype.on = function (intent, dialogId, dialogArgs) {
        this.dialog.matches(intent, dialogId, dialogArgs);
        return this;
    };
    LuisDialog.prototype.onDefault = function (dialogId, dialogArgs) {
        this.dialog.onDefault(dialogId, dialogArgs);
        return this;
    };
    return LuisDialog;
}(Dialog_1.Dialog));
exports.LuisDialog = LuisDialog;
