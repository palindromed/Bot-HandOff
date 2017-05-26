"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Library_1 = require("./bots/Library");
var logger = require("./logger");
var consts = require("./consts");
var fs = require("fs");
var async = require("async");
var Promise = require("promise");
var path = require("path");
var DefaultLocalizer = (function () {
    function DefaultLocalizer(root, defaultLocale) {
        this.localePaths = [];
        this.locales = {};
        this.defaultLocale(defaultLocale || 'en');
        var libsSeen = {};
        var _that = this;
        function addPaths(library) {
            if (!libsSeen.hasOwnProperty(library.name)) {
                libsSeen[library.name] = true;
                library.forEachLibrary(function (child) {
                    addPaths(child);
                });
                var path = library.localePath();
                if (path && fs.existsSync(path)) {
                    _that.localePaths.push(path);
                }
            }
        }
        libsSeen[Library_1.systemLib.name] = true;
        addPaths(root);
    }
    DefaultLocalizer.prototype.defaultLocale = function (locale) {
        if (locale) {
            this._defaultLocale = locale;
        }
        else {
            return this._defaultLocale;
        }
    };
    DefaultLocalizer.prototype.load = function (locale, done) {
        var _this = this;
        logger.debug("localizer.load(%s)", locale);
        locale = locale ? locale : this._defaultLocale;
        var fbDefault = this.getFallback(this._defaultLocale);
        var fbLocale = this.getFallback(locale);
        var locales = ['en'];
        if (fbDefault !== 'en') {
            locales.push(fbDefault);
        }
        if (this._defaultLocale !== fbDefault) {
            locales.push(this._defaultLocale);
        }
        if (fbLocale !== fbDefault) {
            locales.push(fbLocale);
        }
        if (locale !== fbLocale && locale !== this._defaultLocale) {
            locales.push(locale);
        }
        async.each(locales, function (locale, cb) {
            _this.loadLocale(locale).done(function () { return cb(); }, function (err) { return cb(err); });
        }, function (err) {
            if (done) {
                done(err);
            }
        });
    };
    DefaultLocalizer.prototype.trygettext = function (locale, msgid, ns) {
        locale = locale ? locale : this._defaultLocale;
        var fbDefault = this.getFallback(this._defaultLocale);
        var fbLocale = this.getFallback(locale);
        ns = ns ? ns.toLocaleLowerCase() : null;
        var key = this.createKey(ns, msgid);
        var text = this.getEntry(locale, key);
        if (!text && fbLocale !== locale) {
            text = this.getEntry(fbLocale, key);
        }
        if (!text && this._defaultLocale !== locale) {
            text = this.getEntry(this._defaultLocale, key);
        }
        if (!text && fbDefault !== this._defaultLocale) {
            text = this.getEntry(fbDefault, key);
        }
        if (!text && fbDefault !== 'en') {
            text = this.getEntry('en', key);
        }
        return text ? this.getValue(text) : null;
    };
    DefaultLocalizer.prototype.gettext = function (locale, msgid, ns) {
        return this.trygettext(locale, msgid, ns) || msgid;
    };
    DefaultLocalizer.prototype.ngettext = function (locale, msgid, msgid_plural, count, ns) {
        return count == 1 ? this.gettext(locale, msgid, ns) : this.gettext(locale, msgid_plural, ns);
    };
    DefaultLocalizer.prototype.getFallback = function (locale) {
        if (locale) {
            var split = locale.indexOf("-");
            if (split != -1) {
                return locale.substring(0, split);
            }
        }
        return this.defaultLocale();
    };
    DefaultLocalizer.prototype.loadLocale = function (locale) {
        var _this = this;
        var asyncEachSeries = Promise.denodeify(async.eachSeries);
        if (!this.locales.hasOwnProperty(locale)) {
            var entry;
            this.locales[locale] = entry = { loaded: null, entries: {} };
            entry.loaded = new Promise(function (resolve, reject) {
                _this.loadSystemResources(locale)
                    .then(function () {
                    return asyncEachSeries(_this.localePaths, function (localePath, cb) {
                        _this.loadLocalePath(locale, localePath).done(function () { return cb(); }, function (err) { return cb(err); });
                    });
                }).done(function () { return resolve(true); }, function (err) { return reject(err); });
            });
        }
        return this.locales[locale].loaded;
    };
    DefaultLocalizer.prototype.loadLocalePath = function (locale, localePath) {
        var _this = this;
        var dir = path.join(localePath, locale);
        var entryCount = 0;
        var p = new Promise(function (resolve, reject) {
            var access = Promise.denodeify(fs.access);
            var readdir = Promise.denodeify(fs.readdir);
            var asyncEach = Promise.denodeify(async.each);
            access(dir)
                .then(function () {
                return readdir(dir);
            })
                .then(function (files) {
                return asyncEach(files, function (file, cb) {
                    if (file.substring(file.length - 5).toLowerCase() == ".json") {
                        logger.debug("localizer.load(%s) - Loading %s/%s", locale, dir, file);
                        _this.parseFile(locale, dir, file)
                            .then(function (count) {
                            entryCount += count;
                            cb();
                        }, function (err) {
                            logger.error("localizer.load(%s) - Error reading %s/%s: %s", locale, dir, file, err.toString());
                            cb();
                        });
                    }
                    else {
                        cb();
                    }
                });
            })
                .then(function () {
                resolve(entryCount);
            }, function (err) {
                if (err.code === 'ENOENT') {
                    logger.debug("localizer.load(%s) - Couldn't find directory: %s", locale, dir);
                    resolve(-1);
                }
                else {
                    logger.error('localizer.load(%s) - Error: %s', locale, err.toString());
                    reject(err);
                }
            });
        });
        return p;
    };
    DefaultLocalizer.prototype.parseFile = function (locale, localeDir, filename) {
        var _this = this;
        var table = this.locales[locale];
        return new Promise(function (resolve, reject) {
            var filePath = path.join(localeDir, filename);
            var readFile = Promise.denodeify(fs.readFile);
            readFile(filePath, 'utf8')
                .then(function (data) {
                var ns = path.parse(filename).name.toLocaleLowerCase();
                if (ns == 'index') {
                    ns = null;
                }
                try {
                    var cnt = 0;
                    var entries = JSON.parse(data);
                    for (var key in entries) {
                        var k = _this.createKey(ns, key);
                        table.entries[k] = entries[key];
                        ++cnt;
                    }
                    resolve(cnt);
                }
                catch (error) {
                    return reject(error);
                }
            }, function (err) {
                reject(err);
            });
        });
    };
    DefaultLocalizer.prototype.loadSystemResources = function (locale) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var access = Promise.denodeify(fs.access);
            var dir = path.join(Library_1.systemLib.localePath(), locale);
            var filename = Library_1.systemLib.name + '.json';
            var filepath = path.join(dir, filename);
            access(filepath)
                .then(function () {
                return _this.parseFile(locale, dir, filename);
            })
                .done(function (count) { return resolve(count); }, function (err) {
                if (err.code === 'ENOENT') {
                    logger.debug("localizer.loadSystemResources(%s) - Couldn't find file: %s", locale, filepath);
                    resolve(-1);
                }
                else {
                    logger.error('localizer.loadSystemResources(%s) - Error: %s', locale, err.toString());
                    reject(err);
                }
            });
        });
    };
    DefaultLocalizer.prototype.createKey = function (ns, msgid) {
        var escapedMsgId = this.escapeKey(msgid);
        var prepend = "";
        if (ns && ns !== consts.Library.default) {
            prepend = ns + ":";
        }
        return prepend + msgid;
    };
    DefaultLocalizer.prototype.escapeKey = function (key) {
        return key.replace(/:/g, "--").toLowerCase();
    };
    DefaultLocalizer.prototype.getEntry = function (locale, key) {
        return this.locales.hasOwnProperty(locale) && this.locales[locale].entries.hasOwnProperty(key) ? this.locales[locale].entries[key] : null;
    };
    DefaultLocalizer.prototype.getValue = function (text) {
        return typeof text == "string" ? text : this.randomizeValue(text);
    };
    DefaultLocalizer.prototype.randomizeValue = function (a) {
        var i = Math.floor(Math.random() * a.length);
        return this.getValue(a[i]);
    };
    return DefaultLocalizer;
}());
exports.DefaultLocalizer = DefaultLocalizer;
