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
var Prompt_1 = require("./Prompt");
var PromptChoice_1 = require("./PromptChoice");
var PromptRecognizers_1 = require("./PromptRecognizers");
var consts = require("../consts");
var PromptConfirm = (function (_super) {
    __extends(PromptConfirm, _super);
    function PromptConfirm(features) {
        var _this = _super.call(this, {
            defaultRetryPrompt: 'default_confirm',
            defaultRetryNamespace: consts.Library.system,
            recognizeNumbers: false,
            recognizeOrdinals: false,
            recognizeChoices: false,
            defaultListStyle: Prompt_1.ListStyle.none
        }) || this;
        _this.updateFeatures(features);
        _this.onRecognize(function (context, cb) {
            if (context.message.text && !_this.features.disableRecognizer) {
                var entities = PromptRecognizers_1.PromptRecognizers.recognizeBooleans(context);
                var top_1 = PromptRecognizers_1.PromptRecognizers.findTopEntity(entities);
                if (top_1) {
                    cb(null, top_1.score, top_1.entity);
                }
                else {
                    cb(null, 0.0);
                }
            }
            else {
                cb(null, 0.0);
            }
        });
        _this.onChoices(function (context, callback) {
            var options = context.dialogData.options;
            if (options.choices) {
                callback(null, options.choices);
            }
            else {
                var locale = context.preferredLocale();
                callback(null, [
                    { value: context.localizer.gettext(locale, 'confirm_yes', consts.Library.system) },
                    { value: context.localizer.gettext(locale, 'confirm_no', consts.Library.system) }
                ]);
            }
        });
        return _this;
    }
    return PromptConfirm;
}(PromptChoice_1.PromptChoice));
exports.PromptConfirm = PromptConfirm;
