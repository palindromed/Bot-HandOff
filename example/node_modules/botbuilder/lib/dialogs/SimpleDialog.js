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
var Dialog_1 = require("./Dialog");
var SimpleDialog = (function (_super) {
    __extends(SimpleDialog, _super);
    function SimpleDialog(fn) {
        var _this = _super.call(this) || this;
        _this.fn = fn;
        return _this;
    }
    SimpleDialog.prototype.begin = function (session, args) {
        this.fn(session, args);
    };
    SimpleDialog.prototype.replyReceived = function (session) {
        this.fn(session);
    };
    SimpleDialog.prototype.dialogResumed = function (session, result) {
        this.fn(session, result);
    };
    return SimpleDialog;
}(Dialog_1.Dialog));
exports.SimpleDialog = SimpleDialog;
