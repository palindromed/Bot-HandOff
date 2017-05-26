"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Dialog_1 = require("../dialogs/Dialog");
var Library_1 = require("../bots/Library");
var SimpleDialog_1 = require("../dialogs/SimpleDialog");
var consts = require("../consts");
var Middleware = (function () {
    function Middleware() {
    }
    Middleware.dialogVersion = function (options) {
        return {
            botbuilder: function (session, next) {
                var cur = session.sessionState.version || 0.0;
                var curMajor = Math.floor(cur);
                var major = Math.floor(options.version);
                if (session.sessionState.callstack.length && curMajor !== major) {
                    session.endConversation(options.message || "Sorry. The service was upgraded and we need to start over.");
                }
                else if (options.resetCommand && session.message.text && options.resetCommand.test(session.message.text)) {
                    session.endConversation(options.message || "Sorry. The service was upgraded and we need to start over.");
                }
                else {
                    session.sessionState.version = options.version;
                    next();
                }
            }
        };
    };
    Middleware.firstRun = function (options) {
        return {
            botbuilder: function (session, next) {
                if (session.sessionState.callstack.length == 0) {
                    var cur = session.userData[consts.Data.FirstRunVersion] || 0.0;
                    var curMajor = Math.floor(cur);
                    var major = Math.floor(options.version);
                    if (major > curMajor) {
                        session.beginDialog(consts.DialogId.FirstRun, {
                            version: options.version,
                            dialogId: options.dialogId,
                            dialogArgs: options.dialogArgs
                        });
                    }
                    else if (options.version > cur && options.upgradeDialogId) {
                        session.beginDialog(consts.DialogId.FirstRun, {
                            version: options.version,
                            dialogId: options.upgradeDialogId,
                            dialogArgs: options.upgradeDialogArgs
                        });
                    }
                    else {
                        next();
                    }
                }
                else {
                    next();
                }
            }
        };
    };
    Middleware.sendTyping = function () {
        return {
            botbuilder: function (session, next) {
                session.sendTyping();
                next();
            }
        };
    };
    return Middleware;
}());
exports.Middleware = Middleware;
Library_1.systemLib.dialog(consts.DialogId.FirstRun, new SimpleDialog_1.SimpleDialog(function (session, args) {
    if (args && args.hasOwnProperty('resumed')) {
        var result = args;
        if (result.resumed == Dialog_1.ResumeReason.completed) {
            session.userData[consts.Data.FirstRunVersion] = session.dialogData.version;
        }
        session.endDialogWithResult(result);
    }
    else {
        var dialogId = args.dialogId.indexOf(':') >= 0 ? args.dialogId : consts.Library.default + ':' + args.dialogId;
        session.dialogData.version = args.version;
        session.beginDialog(dialogId, args.dialogArgs);
    }
}));
