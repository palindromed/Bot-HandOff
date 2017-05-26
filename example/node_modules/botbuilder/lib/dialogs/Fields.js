"use strict";
var dialog = require('./Dialog');
var consts = require('../consts');
var prompts = require('./Prompts');
var mb = require('../Message');
var sd = require('./SimpleDialog');
var dl = require('../bots/Library');
var utils = require('../utils');
var er = require('./EntityRecognizer');
var FieldType;
(function (FieldType) {
    FieldType[FieldType["text"] = 0] = "text";
    FieldType[FieldType["number"] = 1] = "number";
    FieldType[FieldType["confirm"] = 2] = "confirm";
    FieldType[FieldType["choice"] = 3] = "choice";
    FieldType[FieldType["time"] = 4] = "time";
    FieldType[FieldType["dialog"] = 5] = "dialog";
})(FieldType || (FieldType = {}));
var Fields = (function () {
    function Fields() {
    }
    Fields.text = function (field, prompt, options) {
        if (options === void 0) { options = {}; }
        return function (session, results, next) {
            var args = utils.clone(options);
            args.field = field;
            args.fieldType = FieldType.text;
            args.prompt = prompt;
            processField(session, results, next, args);
        };
    };
    Fields.number = function (field, prompt, options) {
        if (options === void 0) { options = {}; }
        return function (session, results, next) {
            var args = utils.clone(options);
            args.field = field;
            args.fieldType = FieldType.number;
            args.prompt = prompt;
            processField(session, results, next, args);
        };
    };
    Fields.confirm = function (field, prompt, options) {
        if (options === void 0) { options = {}; }
        return function (session, results, next) {
            var args = utils.clone(options);
            args.field = field;
            args.fieldType = FieldType.confirm;
            args.prompt = prompt;
            processField(session, results, next, args);
        };
    };
    Fields.choice = function (field, prompt, choices, options) {
        if (options === void 0) { options = {}; }
        return function (session, results, next) {
            var args = utils.clone(options);
            args.field = field;
            args.fieldType = FieldType.choice;
            args.prompt = prompt;
            args.enumValues = er.EntityRecognizer.expandChoices(choices);
            args.listStyle = args.hasOwnProperty('listStyle') ? args.listStyle : prompts.ListStyle.auto;
            processField(session, results, next, args);
        };
    };
    Fields.time = function (field, prompt, options) {
        if (options === void 0) { options = {}; }
        return function (session, results, next) {
            var args = utils.clone(options);
            args.field = field;
            args.fieldType = FieldType.time;
            args.prompt = prompt;
            processField(session, results, next, args);
        };
    };
    Fields.dialog = function (field, dialogId, dialogArgs, options) {
        if (options === void 0) { options = {}; }
        return function (session, results, next) {
            var args = utils.clone(options);
            args.field = field;
            args.fieldType = FieldType.time;
            args.dialogId = dialogId;
            args.dialogArgs = dialogArgs;
            processField(session, results, next, args);
        };
    };
    Fields.endForm = function () {
        return function (session, results, next) {
            var r = saveResults(session, results);
            if (r.resumed == dialog.ResumeReason.completed) {
                var form = session.dialogData[consts.Data.Form];
                delete session.dialogData[consts.Data.Form];
                next({ resumed: dialog.ResumeReason.completed, response: form });
            }
            else {
                next(r);
            }
        };
    };
    Fields.returnForm = function () {
        return function (session, results, next) {
            var r = saveResults(session, results);
            if (r.resumed == dialog.ResumeReason.completed) {
                var form = session.dialogData[consts.Data.Form];
                delete session.dialogData[consts.Data.Form];
                session.endDialogWithResult({ resumed: dialog.ResumeReason.completed, response: form });
            }
            else {
                session.endDialogWithResult(r);
            }
        };
    };
    Fields.onPromptUseDefault = function () {
        return function (context, next) {
            var type = typeof context.form[context.field];
            if (type === 'undefined' || type === 'null') {
                type = typeof context.userData[context.field];
                if (type === 'undefined' || type === 'null') {
                    next(false);
                }
                else {
                    context.form[context.field] = context.userData[context.field];
                    next(true);
                }
            }
            else {
                next(true);
            }
        };
    };
    return Fields;
}());
exports.Fields = Fields;
dl.systemLib.dialog(consts.DialogId.Field, new sd.SimpleDialog(function (session, args) {
    var fieldArgs = session.dialogData;
    function callPrompt() {
        fieldArgs.returnResults = true;
        if (fieldArgs.fieldType == FieldType.dialog) {
            session.beginDialog(fieldArgs.dialogId, fieldArgs.dialogArgs);
        }
        else {
            session.beginDialog(consts.DialogId.Prompts, fieldArgs);
        }
    }
    if (args.hasOwnProperty('resumed')) {
        if (fieldArgs.returnResults || args.resumed !== dialog.ResumeReason.completed) {
            session.endDialog(args);
        }
        else {
            if (fieldArgs.confirmPrompt && !args.response) {
                callPrompt();
            }
            else if (fieldArgs.optionalPrompt && args.response) {
                callPrompt();
            }
            else {
                session.endDialogWithResult({ response: fieldArgs.value, resumed: dialog.ResumeReason.completed });
            }
        }
    }
    else {
        for (var key in args) {
            if (args.hasOwnProperty(key) && typeof args[key] !== 'function') {
                fieldArgs[key] = args[key];
            }
        }
        if (fieldArgs.confirmPrompt || fieldArgs.optionalPrompt) {
            prompts.Prompts.confirm(session, fieldArgs.confirmPrompt || fieldArgs.optionalPrompt);
        }
        else {
            callPrompt();
        }
    }
}));
function processField(session, results, next, args) {
    var r = saveResults(session, results);
    if (r.resumed == dialog.ResumeReason.completed) {
        try {
            var dataType;
            switch (args.fieldType) {
                case FieldType.choice:
                case FieldType.text:
                    dataType = 'text';
                    break;
                case FieldType.confirm:
                    dataType = 'boolean';
                    break;
                case FieldType.number:
                case FieldType.time:
                    dataType = 'number';
                default:
                    dataType = null;
                    break;
            }
            onPrompt(session, args.field, dataType, args, function (skip) {
                args.value = session.dialogData[consts.Data.Form][args.field];
                var valueType = typeof args.value;
                var hasValue = (valueType !== 'null' && valueType !== 'undefined');
                if (args.confirmPrompt) {
                    if (hasValue) {
                        skip = false;
                        args.confirmPrompt = expandTemplate(session, args.field, args.confirmPrompt);
                    }
                    else {
                        delete args.confirmPrompt;
                    }
                }
                if (args.optionalPrompt) {
                    if (!hasValue) {
                        skip = false;
                        args.optionalPrompt = expandTemplate(session, args.field, args.optionalPrompt);
                    }
                    else {
                        delete args.optionalPrompt;
                    }
                }
                if (!skip) {
                    if (args.prompt) {
                        args.prompt = expandTemplate(session, args.field, args.prompt);
                    }
                    if (args.retryPrompt && typeof args.retryPrompt !== 'object') {
                        args.retryPrompt = expandTemplate(session, args.field, args.retryPrompt);
                    }
                    session.dialogData[consts.Data.Field] = { type: args.fieldType, name: args.field };
                    session.beginDialog(consts.DialogId.Field, args);
                }
                else {
                    next();
                }
            });
        }
        catch (e) {
            next({ error: e instanceof Error ? e : new Error(e.toString()), resumed: dialog.ResumeReason.notCompleted });
        }
    }
    else {
        next(r);
    }
}
function saveResults(session, results) {
    var r;
    if (results && results.hasOwnProperty('resumed')) {
        if (session.dialogData.hasOwnProperty(consts.Data.Form) && session.dialogData.hasOwnProperty(consts.Data.Field)) {
            var field = session.dialogData[consts.Data.Field];
            delete session.dialogData[consts.Data.Field];
            if (results.resumed == dialog.ResumeReason.completed) {
                var dataType = typeof results.response;
                if (dataType == 'object') {
                    switch (field.type) {
                        case FieldType.choice:
                            session.dialogData[consts.Data.Form][field.name] = results.response.entity;
                            break;
                        case FieldType.time:
                            if (results.response.resolution && results.response.resolution.start) {
                                session.dialogData[consts.Data.Form][field.name] = results.response.resolution.start.getTime();
                            }
                            break;
                        default:
                            session.dialogData[consts.Data.Form][field.name] = results.response;
                            break;
                    }
                }
                else {
                    session.dialogData[consts.Data.Form][field.name] = results.response;
                }
            }
            else {
                r = results;
            }
        }
        else if (typeof results.response === 'object') {
            session.dialogData[consts.Data.Form] = results.response;
        }
        if (!r) {
            r = { resumed: dialog.ResumeReason.completed };
        }
    }
    else {
        session.dialogData[consts.Data.Form] = results || {};
        r = { resumed: dialog.ResumeReason.completed };
    }
    return r;
}
function onPrompt(session, field, type, options, cb) {
    var form = session.dialogData[consts.Data.Form];
    var context = { userData: session.userData, form: form, field: field };
    if (options.onPrompt) {
        options.onPrompt(context, cb);
    }
    else if (form && form.hasOwnProperty(field)) {
        var dataType = typeof form[field];
        switch (dataType) {
            case 'null':
            case 'undefined':
                cb(false);
                break;
            default:
                cb(type == null || dataType == type);
                break;
        }
    }
    else {
        cb(false);
    }
}
function expandTemplate(session, field, prompt) {
    var form = session.dialogData[consts.Data.Form];
    var value = form.hasOwnProperty(field) ? form[field] : '';
    var args = { userData: session.userData, form: form, value: value };
    return session.gettext(mb.Message.randomPrompt(prompt), args);
}
