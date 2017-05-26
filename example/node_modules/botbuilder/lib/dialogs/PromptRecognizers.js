"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EntityRecognizer_1 = require("./EntityRecognizer");
var consts = require("../consts");
var breakingChars = " \n\r~`!@#$%^&*()-+={}|[]\\:\";'<>?,./";
var PromptRecognizers = (function () {
    function PromptRecognizers() {
    }
    PromptRecognizers.recognizeLocalizedRegExp = function (context, expId, namespace) {
        var key = namespace + ':' + expId;
        var entities = [];
        var locale = context.preferredLocale();
        var utterance = context.message.text ? context.message.text.trim() : '';
        var cache = this.expCache[key];
        if (!cache) {
            this.expCache[key] = cache = {};
        }
        if (!cache.hasOwnProperty(locale)) {
            cache[locale] = new RegExp(context.localizer.gettext(locale, expId, namespace), 'ig');
        }
        var matches = matchAll(cache[locale], utterance);
        matches.forEach(function (value) {
            entities.push({
                type: consts.Entities.String,
                entity: value,
                score: PromptRecognizers.calculateScore(utterance, value)
            });
        });
        return entities;
    };
    PromptRecognizers.recognizeLocalizedChoices = function (context, listId, namespace, options) {
        var key = namespace + ':' + listId;
        var entities = [];
        var locale = context.preferredLocale();
        var utterance = context.message.text ? context.message.text.trim() : '';
        var cache = this.choiceCache[key];
        if (!cache) {
            this.expCache[key] = cache = {};
        }
        if (!cache.hasOwnProperty(locale)) {
            var list = context.localizer.gettext(locale, listId, namespace);
            cache[locale] = PromptRecognizers.toChoices(list);
        }
        return PromptRecognizers.recognizeChoices(context.message.text, cache[locale], options);
    };
    PromptRecognizers.toChoices = function (list) {
        var choices = [];
        if (list) {
            list.split('|').forEach(function (value, index) {
                var pos = value.indexOf('=');
                if (pos > 0) {
                    choices.push({
                        value: value.substr(0, pos),
                        synonyms: value.substr(pos + 1).split(',')
                    });
                }
                else {
                    choices.push({
                        value: value,
                        synonyms: []
                    });
                }
            });
        }
        return choices;
    };
    PromptRecognizers.recognizeBooleans = function (context) {
        var entities = [];
        var results = PromptRecognizers.recognizeLocalizedChoices(context, 'boolean_choices', consts.Library.system, { excludeValue: true });
        if (results) {
            results.forEach(function (result) {
                var value = (result.entity.entity === 'true');
                entities.push({
                    type: consts.Entities.Boolean,
                    entity: value,
                    score: result.score
                });
            });
        }
        return entities;
    };
    PromptRecognizers.recognizeNumbers = function (context, options) {
        function addEntity(n, score) {
            if ((typeof options.minValue !== 'number' || n >= options.minValue) &&
                (typeof options.maxValue !== 'number' || n <= options.maxValue) &&
                (!options.integerOnly || Math.floor(n) == n)) {
                entities.push({
                    type: consts.Entities.Number,
                    entity: n,
                    score: score
                });
            }
        }
        options = options || {};
        var entities = [];
        var matches = PromptRecognizers.recognizeLocalizedRegExp(context, 'number_exp', consts.Library.system);
        if (matches) {
            matches.forEach(function (entity) {
                var n = Number(entity.entity);
                addEntity(n, entity.score);
            });
        }
        var results = PromptRecognizers.recognizeLocalizedChoices(context, 'number_terms', consts.Library.system, { excludeValue: true });
        if (results) {
            results.forEach(function (result) {
                var n = Number(result.entity.entity);
                addEntity(n, result.score);
            });
        }
        return entities;
    };
    PromptRecognizers.recognizeOrdinals = function (context) {
        var entities = [];
        var results = PromptRecognizers.recognizeLocalizedChoices(context, 'number_ordinals', consts.Library.system, { excludeValue: true });
        if (results) {
            results.forEach(function (result) {
                var n = Number(result.entity.entity);
                entities.push({
                    type: consts.Entities.Number,
                    entity: n,
                    score: result.score
                });
            });
        }
        results = PromptRecognizers.recognizeLocalizedChoices(context, 'number_reverse_ordinals', consts.Library.system, { excludeValue: true });
        if (results) {
            results.forEach(function (result) {
                var n = Number(result.entity.entity);
                entities.push({
                    type: consts.Entities.Number,
                    entity: n,
                    score: result.score
                });
            });
        }
        return entities;
    };
    PromptRecognizers.recognizeTimes = function (context, options) {
        options = options || {};
        var refData = options.refDate ? new Date(options.refDate) : null;
        var entities = [];
        var utterance = context.message.text ? context.message.text.trim() : '';
        var entity = EntityRecognizer_1.EntityRecognizer.recognizeTime(utterance, refData);
        if (entity) {
            entity.score = PromptRecognizers.calculateScore(utterance, entity.entity);
            entities.push(entity);
        }
        return entities;
    };
    PromptRecognizers.recognizeChoices = function (utterance, choices, options) {
        options = options || {};
        var entities = [];
        choices.forEach(function (choice, index) {
            var values = Array.isArray(choice.synonyms) ? choice.synonyms : (choice.synonyms || '').split('|');
            if (!options.excludeValue) {
                values.push(choice.value);
            }
            if (choice.action && !options.excludeAction) {
                var action = choice.action;
                if (action.title && action.title !== choice.value) {
                    values.push(action.title);
                }
                if (action.value && action.value !== choice.value && action.value !== action.title) {
                    values.push(action.value);
                }
            }
            var match = PromptRecognizers.findTopEntity(PromptRecognizers.recognizeValues(utterance, values, options));
            if (match) {
                entities.push({
                    type: consts.Entities.Match,
                    score: match.score,
                    entity: {
                        index: index,
                        entity: choice.value,
                        score: match.score
                    }
                });
            }
        });
        return entities;
    };
    PromptRecognizers.recognizeValues = function (utterance, values, options) {
        function indexOfToken(token, startPos) {
            for (var i = startPos; i < tokens.length; i++) {
                if (tokens[i] === token) {
                    return i;
                }
            }
            return -1;
        }
        function matchValue(vTokens, startPos) {
            var matched = 0;
            var totalDeviation = 0;
            vTokens.forEach(function (token) {
                var pos = indexOfToken(token, startPos);
                if (pos >= 0) {
                    var distance = matched > 0 ? pos - startPos : 0;
                    if (distance <= maxDistance) {
                        matched++;
                        totalDeviation += distance;
                        startPos = pos + 1;
                    }
                }
            });
            var score = 0.0;
            if (matched > 0 && (matched == vTokens.length || options.allowPartialMatches)) {
                var completeness = matched / vTokens.length;
                var accuracy = completeness * (matched / (matched + totalDeviation));
                var initialScore = accuracy * (matched / tokens.length);
                score = 0.4 + (0.6 * initialScore);
            }
            return score;
        }
        options = options || {};
        var entities = [];
        var text = utterance.trim().toLowerCase();
        var tokens = tokenize(text);
        var maxDistance = options.hasOwnProperty('maxTokenDistance') ? options.maxTokenDistance : 2;
        values.forEach(function (value, index) {
            if (typeof value === 'string') {
                var topScore = 0.0;
                var vTokens = tokenize(value.trim().toLowerCase());
                for (var i = 0; i < tokens.length; i++) {
                    var score = matchValue(vTokens, i);
                    if (score > topScore) {
                        topScore = score;
                    }
                }
                if (topScore > 0.0) {
                    entities.push({
                        type: consts.Entities.Number,
                        entity: index,
                        score: topScore
                    });
                }
            }
            else {
                var matches = value.exec(text) || [];
                if (matches.length > 0) {
                    entities.push({
                        type: consts.Entities.Number,
                        entity: index,
                        score: PromptRecognizers.calculateScore(text, matches[0])
                    });
                }
            }
        });
        return entities;
    };
    PromptRecognizers.findTopEntity = function (entities) {
        var top = null;
        if (entities) {
            entities.forEach(function (entity) {
                if (!top || entity.score > top.score) {
                    top = entity;
                }
            });
        }
        return top;
    };
    PromptRecognizers.calculateScore = function (utterance, entity, max, min) {
        if (max === void 0) { max = 1.0; }
        if (min === void 0) { min = 0.5; }
        return Math.min(min + (entity.length / utterance.length), max);
    };
    return PromptRecognizers;
}());
PromptRecognizers.numOrdinals = {};
PromptRecognizers.expCache = {};
PromptRecognizers.choiceCache = {};
exports.PromptRecognizers = PromptRecognizers;
function matchAll(exp, text) {
    exp.lastIndex = 0;
    var matches = [];
    var match;
    while ((match = exp.exec(text)) != null) {
        matches.push(match[0]);
    }
    return matches;
}
function tokenize(text) {
    var tokens = [];
    if (text && text.length > 0) {
        var token = '';
        for (var i = 0; i < text.length; i++) {
            var chr = text[i];
            if (breakingChars.indexOf(chr) >= 0) {
                if (token.length > 0) {
                    tokens.push(token);
                }
                token = '';
            }
            else {
                token += chr;
            }
        }
        if (token.length > 0) {
            tokens.push(token);
        }
    }
    return tokens;
}
