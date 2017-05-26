"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IntentRecognizer = (function () {
    function IntentRecognizer() {
        this._onEnabled = [];
        this._onFilter = [];
    }
    IntentRecognizer.prototype.recognize = function (context, callback) {
        var _this = this;
        this.isEnabled(context, function (err, enabled) {
            if (err) {
                callback(err, null);
            }
            else if (!enabled) {
                callback(null, { score: 0.0, intent: null });
            }
            else {
                _this.onRecognize(context, function (err, result) {
                    if (!err) {
                        _this.filter(context, result, callback);
                    }
                    else {
                        callback(err, result);
                    }
                });
            }
        });
    };
    IntentRecognizer.prototype.onEnabled = function (handler) {
        this._onEnabled.unshift(handler);
        return this;
    };
    IntentRecognizer.prototype.onFilter = function (handler) {
        this._onFilter.push(handler);
        return this;
    };
    IntentRecognizer.prototype.isEnabled = function (context, callback) {
        var index = 0;
        var _that = this;
        function next(err, enabled) {
            if (index < _that._onEnabled.length && !err && enabled) {
                try {
                    _that._onEnabled[index++](context, next);
                }
                catch (e) {
                    callback(e, false);
                }
            }
            else {
                callback(err, enabled);
            }
        }
        next(null, true);
    };
    IntentRecognizer.prototype.filter = function (context, result, callback) {
        var index = 0;
        var _that = this;
        function next(err, r) {
            if (index < _that._onFilter.length && !err) {
                try {
                    _that._onFilter[index++](context, r, next);
                }
                catch (e) {
                    callback(e, null);
                }
            }
            else {
                callback(err, r);
            }
        }
        next(null, result);
    };
    return IntentRecognizer;
}());
exports.IntentRecognizer = IntentRecognizer;
