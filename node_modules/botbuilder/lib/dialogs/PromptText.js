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
var consts = require("../consts");
var PromptText = (function (_super) {
    __extends(PromptText, _super);
    function PromptText(features) {
        var _this = _super.call(this, {
            defaultRetryPrompt: 'default_text',
            defaultRetryNamespace: consts.Library.system,
            recognizeScore: 0.5
        }) || this;
        _this.updateFeatures(features);
        _this.onRecognize(function (context, cb) {
            if (context.message.text && !_this.features.disableRecognizer) {
                cb(null, _this.features.recognizeScore, context.message.text);
            }
            else {
                cb(null, 0.0);
            }
        });
        _this.matches(consts.Intents.Repeat, function (session) {
            session.dialogData.turns = 0;
            _this.sendPrompt(session);
        });
        return _this;
    }
    return PromptText;
}(Prompt_1.Prompt));
exports.PromptText = PromptText;
