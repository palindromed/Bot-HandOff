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
var consts = require("../consts");
var WaterfallDialog = (function (_super) {
    __extends(WaterfallDialog, _super);
    function WaterfallDialog(steps) {
        var _this = _super.call(this) || this;
        _this._onBeforeStep = [];
        if (steps) {
            _this.steps = Array.isArray(steps) ? steps : [steps];
        }
        else {
            _this.steps = [];
        }
        return _this;
    }
    WaterfallDialog.prototype.begin = function (session, args) {
        this.doStep(session, 0, args);
    };
    WaterfallDialog.prototype.replyReceived = function (session, recognizeResult) {
        this.doStep(session, 0, recognizeResult.args);
    };
    WaterfallDialog.prototype.dialogResumed = function (session, result) {
        var step = session.dialogData[consts.Data.WaterfallStep];
        switch (result.resumed) {
            case Dialog_1.ResumeReason.reprompt:
                return;
            case Dialog_1.ResumeReason.back:
                step--;
                break;
            default:
                step++;
                break;
        }
        this.doStep(session, step, result);
    };
    WaterfallDialog.prototype.onBeforeStep = function (handler) {
        this._onBeforeStep.unshift(handler);
        return this;
    };
    WaterfallDialog.prototype.doStep = function (session, step, args) {
        var _this = this;
        var skip = function (result) {
            result = result || {};
            if (result.resumed == null) {
                result.resumed = Dialog_1.ResumeReason.forward;
            }
            _this.dialogResumed(session, result);
        };
        this.beforeStep(session, step, args, function (s, a) {
            if (s >= 0) {
                if (s < _this.steps.length) {
                    try {
                        session.logger.log(session.dialogStack(), 'waterfall() step ' + (s + 1) + ' of ' + _this.steps.length);
                        session.dialogData[consts.Data.WaterfallStep] = s;
                        _this.steps[s](session, a, skip);
                    }
                    catch (e) {
                        session.error(e);
                    }
                }
                else if (a && a.hasOwnProperty('resumed')) {
                    session.endDialogWithResult(a);
                }
                else {
                    session.logger.warn(session.dialogStack(), 'waterfall() empty waterfall detected');
                    session.endDialogWithResult({ resumed: Dialog_1.ResumeReason.notCompleted });
                }
            }
        });
    };
    WaterfallDialog.prototype.beforeStep = function (session, step, args, final) {
        var index = 0;
        var handlers = this._onBeforeStep;
        function next(s, a) {
            try {
                if (index < handlers.length) {
                    handlers[index++](session, s, a, next);
                }
                else {
                    final(s, a);
                }
            }
            catch (e) {
                session.error(e);
            }
        }
        next(step, args);
    };
    WaterfallDialog.createHandler = function (steps) {
        return function waterfallHandler(s, r) {
            var skip = function (result) {
                result = result || {};
                if (result.resumed == null) {
                    result.resumed = Dialog_1.ResumeReason.forward;
                }
                waterfallHandler(s, result);
            };
            if (r && r.hasOwnProperty('resumed')) {
                if (r.resumed !== Dialog_1.ResumeReason.reprompt) {
                    var step = s.dialogData[consts.Data.WaterfallStep];
                    switch (r.resumed) {
                        case Dialog_1.ResumeReason.back:
                            step -= 1;
                            break;
                        default:
                            step++;
                    }
                    if (step >= 0 && step < steps.length) {
                        try {
                            s.logger.log(s.dialogStack(), 'waterfall() step ' + step + 1 + ' of ' + steps.length);
                            s.dialogData[consts.Data.WaterfallStep] = step;
                            steps[step](s, r, skip);
                        }
                        catch (e) {
                            s.error(e);
                        }
                    }
                    else {
                        s.endDialogWithResult(r);
                    }
                }
            }
            else if (steps && steps.length > 0) {
                try {
                    s.logger.log(s.dialogStack(), 'waterfall() step 1 of ' + steps.length);
                    s.dialogData[consts.Data.WaterfallStep] = 0;
                    steps[0](s, r, skip);
                }
                catch (e) {
                    s.error(e);
                }
            }
            else {
                s.logger.warn(s.dialogStack(), 'waterfall() empty waterfall detected');
                s.endDialogWithResult({ resumed: Dialog_1.ResumeReason.notCompleted });
            }
        };
    };
    return WaterfallDialog;
}(Dialog_1.Dialog));
exports.WaterfallDialog = WaterfallDialog;
