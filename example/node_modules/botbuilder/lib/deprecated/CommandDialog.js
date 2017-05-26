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
var CommandDialog = (function (_super) {
    __extends(CommandDialog, _super);
    function CommandDialog(serviceUri) {
        var _this = _super.call(this) || this;
        console.warn('CommandDialog class is deprecated. Use IntentDialog class instead.');
        _this.dialog = new IntentDialog_1.IntentDialog();
        return _this;
    }
    CommandDialog.prototype.begin = function (session, args) {
        this.dialog.begin(session, args);
    };
    CommandDialog.prototype.replyReceived = function (session, recognizeResult) {
    };
    CommandDialog.prototype.dialogResumed = function (session, result) {
        this.dialog.dialogResumed(session, result);
    };
    CommandDialog.prototype.recognize = function (context, cb) {
        this.dialog.recognize(context, cb);
    };
    CommandDialog.prototype.onBegin = function (handler) {
        this.dialog.onBegin(handler);
        return this;
    };
    CommandDialog.prototype.matches = function (patterns, dialogId, dialogArgs) {
        var _this = this;
        var list = (!Array.isArray(patterns) ? [patterns] : patterns);
        list.forEach(function (p) {
            _this.dialog.matches(new RegExp(p, 'i'), dialogId, dialogArgs);
        });
        return this;
    };
    CommandDialog.prototype.onDefault = function (dialogId, dialogArgs) {
        this.dialog.onDefault(dialogId, dialogArgs);
        return this;
    };
    return CommandDialog;
}(Dialog_1.Dialog));
exports.CommandDialog = CommandDialog;
