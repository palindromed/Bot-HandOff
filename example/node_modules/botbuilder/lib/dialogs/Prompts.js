"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Dialog_1 = require("./Dialog");
var Library_1 = require("../bots/Library");
var LegacyPrompts_1 = require("../deprecated/LegacyPrompts");
var Prompt_1 = require("./Prompt");
var PromptAttachment_1 = require("./PromptAttachment");
var PromptChoice_1 = require("./PromptChoice");
var PromptConfirm_1 = require("./PromptConfirm");
var PromptNumber_1 = require("./PromptNumber");
var PromptText_1 = require("./PromptText");
var PromptTime_1 = require("./PromptTime");
var consts = require("../consts");
var utils = require("../utils");
var promptPrefix = consts.Library.system + ':prompt-';
exports.Prompts = {
    text: function (session, prompt, options) {
        validateSession(session);
        var args = utils.clone(options || {});
        args.prompt = prompt || options.prompt;
        session.beginDialog(promptPrefix + 'text', args);
    },
    number: function (session, prompt, options) {
        validateSession(session);
        var args = utils.clone(options || {});
        args.prompt = prompt || options.prompt;
        session.beginDialog(promptPrefix + 'number', args);
    },
    confirm: function (session, prompt, options) {
        validateSession(session);
        var args = utils.clone(options || {});
        args.prompt = prompt || options.prompt;
        session.beginDialog(promptPrefix + 'confirm', args);
    },
    choice: function (session, prompt, choices, options) {
        validateSession(session);
        var args = utils.clone(options || {});
        args.prompt = prompt || options.prompt;
        if (choices) {
            args.choices = [];
            if (Array.isArray(choices)) {
                choices.forEach(function (value) {
                    if (typeof value === 'string') {
                        args.choices.push({ value: value });
                    }
                    else {
                        args.choices.push(value);
                    }
                });
            }
            else if (typeof choices === 'string') {
                choices.split('|').forEach(function (value) {
                    args.choices.push({ value: value });
                });
            }
            else {
                for (var key in choices) {
                    if (choices.hasOwnProperty(key)) {
                        args.choices.push({ value: key });
                    }
                }
            }
        }
        session.beginDialog(promptPrefix + 'choice', args);
    },
    time: function (session, prompt, options) {
        validateSession(session);
        var args = utils.clone(options || {});
        args.prompt = prompt || options.prompt;
        session.beginDialog(promptPrefix + 'time', args);
    },
    attachment: function (session, prompt, options) {
        validateSession(session);
        var args = utils.clone(options || {});
        args.prompt = prompt || options.prompt;
        session.beginDialog(promptPrefix + 'attachment', args);
    },
    disambiguate: function (session, prompt, choices, options) {
        validateSession(session);
        session.beginDialog(consts.DialogId.Disambiguate, {
            prompt: prompt,
            choices: choices,
            options: options
        });
    },
    customize: function (type, dialog) {
        Library_1.systemLib.dialog(promptPrefix + Prompt_1.PromptType[type], dialog, true);
    },
    configure: function (options) {
        console.warn("Prompts.configure() has been deprecated as of version 3.8. Consider using custom prompts instead.");
        LegacyPrompts_1.LegacyPrompts.configure(options);
    }
};
function validateSession(session) {
    if (!session || typeof session != 'object') {
        throw 'Session should be provided as first parameter.';
    }
}
exports.Prompts.customize(Prompt_1.PromptType.attachment, new PromptAttachment_1.PromptAttachment());
exports.Prompts.customize(Prompt_1.PromptType.choice, new PromptChoice_1.PromptChoice());
exports.Prompts.customize(Prompt_1.PromptType.confirm, new PromptConfirm_1.PromptConfirm());
exports.Prompts.customize(Prompt_1.PromptType.number, new PromptNumber_1.PromptNumber());
exports.Prompts.customize(Prompt_1.PromptType.text, new PromptText_1.PromptText());
exports.Prompts.customize(Prompt_1.PromptType.time, new PromptTime_1.PromptTime());
Library_1.systemLib.dialog(consts.DialogId.ConfirmCancel, [
    function (session, args) {
        session.dialogData.localizationNamespace = args.localizationNamespace;
        session.dialogData.dialogIndex = args.dialogIndex;
        session.dialogData.message = args.message;
        session.dialogData.endConversation = args.endConversation;
        exports.Prompts.confirm(session, args.confirmPrompt, { localizationNamespace: args.localizationNamespace });
    },
    function (session, results) {
        if (results.response) {
            var args = session.dialogData;
            if (args.message) {
                session.sendLocalized(args.localizationNamespace, args.message);
            }
            if (args.endConversation) {
                session.endConversation();
            }
            else {
                session.cancelDialog(args.dialogIndex);
            }
        }
        else {
            session.endDialogWithResult({ resumed: Dialog_1.ResumeReason.reprompt });
        }
    }
]);
Library_1.systemLib.dialog(consts.DialogId.ConfirmInterruption, [
    function (session, args) {
        session.dialogData.dialogId = args.dialogId;
        session.dialogData.dialogArgs = args.dialogArgs;
        exports.Prompts.confirm(session, args.confirmPrompt, { localizationNamespace: args.localizationNamespace });
    },
    function (session, results) {
        if (results.response) {
            var args = session.dialogData;
            session.clearDialogStack();
            session.beginDialog(args.dialogId, args.dialogArgs);
        }
        else {
            session.endDialogWithResult({ resumed: Dialog_1.ResumeReason.reprompt });
        }
    }
]);
Library_1.systemLib.dialog(consts.DialogId.Interruption, [
    function (session, args) {
        if (session.sessionState.callstack.length > 1) {
            session.beginDialog(args.dialogId, args.dialogArgs);
        }
        else {
            session.replaceDialog(args.dialogId, args.dialogArgs);
        }
    },
    function (session, results) {
        session.endDialogWithResult({ resumed: Dialog_1.ResumeReason.reprompt });
    }
]);
Library_1.systemLib.dialog(consts.DialogId.Disambiguate, [
    function (session, args) {
        session.dialogData.choices = args.choices;
        exports.Prompts.choice(session, args.prompt, args.choices, args.options);
    },
    function (session, results) {
        var route = session.dialogData.choices[results.response.entity];
        if (route) {
            var stack = session.dialogStack();
            stack.pop();
            session.dialogStack(stack);
            session.library.library(route.libraryName).selectRoute(session, route);
        }
        else {
            session.endDialogWithResult({ resumed: Dialog_1.ResumeReason.reprompt });
        }
    }
]);
