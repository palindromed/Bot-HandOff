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
var IntentRecognizer_1 = require("./IntentRecognizer");
var RegExpRecognizer = (function (_super) {
    __extends(RegExpRecognizer, _super);
    function RegExpRecognizer(intent, expressions) {
        var _this = _super.call(this) || this;
        _this.intent = intent;
        if (expressions instanceof RegExp || typeof expressions.exec === 'function') {
            _this.expressions = { '*': expressions };
        }
        else {
            _this.expressions = (expressions || {});
        }
        return _this;
    }
    RegExpRecognizer.prototype.onRecognize = function (context, cb) {
        var result = { score: 0.0, intent: null };
        if (context && context.message && context.message.text) {
            var utterance = context.message.text;
            var locale = context.locale || '*';
            var exp = this.expressions.hasOwnProperty(locale) ? this.expressions[locale] : this.expressions['*'];
            if (exp) {
                var matches = exp.exec(context.message.text);
                if (matches && matches.length) {
                    var matched = matches[0];
                    result.score = 0.4 + ((matched.length / context.message.text.length) * 0.6);
                    result.intent = this.intent;
                    result.expression = exp;
                    result.matched = matches;
                }
                cb(null, result);
            }
            else {
                cb(new Error("Expression not found for locale '" + locale + "'."), null);
            }
        }
        else {
            cb(null, result);
        }
    };
    return RegExpRecognizer;
}(IntentRecognizer_1.IntentRecognizer));
exports.RegExpRecognizer = RegExpRecognizer;
