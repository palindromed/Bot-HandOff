"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Prompt_1 = require("./dialogs/Prompt");
var Channel = require("./Channel");
var consts = require("./consts");
var sprintf = require("sprintf-js");
var debugLoggingEnabled = new RegExp('\\bbotbuilder\\b', 'i').test(process.env.NODE_DEBUG || '');
function error(fmt) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var msg = args.length > 0 ? sprintf.vsprintf(fmt, args) : fmt;
    console.error('ERROR: ' + msg);
}
exports.error = error;
function warn(addressable, fmt) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var prefix = getPrefix(addressable);
    var msg = args.length > 0 ? sprintf.vsprintf(fmt, args) : fmt;
    console.warn(prefix + 'WARN: ' + msg);
}
exports.warn = warn;
function info(addressable, fmt) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var channelId = Channel.getChannelId(addressable);
    if (channelId === Channel.channels.emulator || debugLoggingEnabled) {
        var prefix = getPrefix(addressable);
        var msg = args.length > 0 ? sprintf.vsprintf(fmt, args) : fmt;
        console.info(prefix + msg);
    }
}
exports.info = info;
function debug(fmt) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    debugLog(false, fmt, args);
}
exports.debug = debug;
function trace(fmt) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    debugLog(true, fmt, args);
}
exports.trace = trace;
function debugLog(trace, fmt, args) {
    if (!debugLoggingEnabled) {
        return;
    }
    var msg = args.length > 0 ? sprintf.vsprintf(fmt, args) : fmt;
    if (trace) {
        console.trace(msg);
    }
    else {
        console.log(msg);
    }
}
function getPrefix(addressable) {
    var prefix = '';
    var callstack;
    if (Array.isArray(addressable)) {
        callstack = addressable;
    }
    else {
        callstack = addressable && addressable.sessionState && addressable.sessionState.callstack ? addressable.sessionState.callstack : [];
    }
    for (var i = 0; i < callstack.length; i++) {
        if (i == callstack.length - 1) {
            var cur = callstack[i];
            switch (cur.id) {
                case 'BotBuilder:Prompts':
                    var promptType = Prompt_1.PromptType[cur.state.promptType];
                    prefix += 'Prompts.' + promptType + ' - ';
                    break;
                case consts.DialogId.FirstRun:
                    prefix += 'Middleware.firstRun - ';
                    break;
                default:
                    if (cur.id.indexOf('*:') == 0) {
                        prefix += cur.id.substr(2) + ' - ';
                    }
                    else {
                        prefix += cur.id + ' - ';
                    }
                    break;
            }
        }
        else {
            prefix += '.';
        }
    }
    return prefix;
}
exports.getPrefix = getPrefix;
