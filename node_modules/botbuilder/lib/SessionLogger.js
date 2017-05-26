"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger = require("./logger");
var SessionLogger = (function () {
    function SessionLogger() {
        this.isEnabled = new RegExp('\\bbotbuilder\\b', 'i').test(process.env.NODE_DEBUG || '');
    }
    SessionLogger.prototype.dump = function (name, value) {
        if (this.isEnabled && name) {
            if (Array.isArray(value) || typeof value == 'object') {
                try {
                    var v = JSON.stringify(value);
                    console.log(name + ': ' + v);
                }
                catch (e) {
                    console.error(name + ': {STRINGIFY ERROR}');
                }
            }
            else {
                console.log(name + ': ' + value);
            }
        }
    };
    SessionLogger.prototype.log = function (dialogStack, msg) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (this.isEnabled && msg) {
            var prefix = logger.getPrefix(dialogStack);
            args.unshift(prefix + msg);
            console.log.apply(console, args);
        }
    };
    SessionLogger.prototype.warn = function (dialogStack, msg) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (this.isEnabled && msg) {
            var prefix = logger.getPrefix(dialogStack);
            args.unshift(prefix + 'WARN: ' + msg);
            console.warn.apply(console, args);
        }
    };
    SessionLogger.prototype.error = function (dialogStack, err) {
        if (this.isEnabled && err) {
            var prefix = logger.getPrefix(dialogStack);
            console.error(prefix + 'ERROR: ' + err.message);
        }
    };
    SessionLogger.prototype.flush = function (callback) {
        callback(null);
    };
    return SessionLogger;
}());
exports.SessionLogger = SessionLogger;
