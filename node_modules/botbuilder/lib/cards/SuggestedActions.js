"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SuggestedActions = (function () {
    function SuggestedActions(session) {
        this.session = session;
        this.data = {};
    }
    SuggestedActions.prototype.to = function (to) {
        this.data.to = [];
        if (to) {
            if (Array.isArray(to)) {
                for (var i = 0; i < to.length; i++) {
                    this.data.to.push(to[i]);
                }
            }
            else {
                this.data.to.push(to);
            }
        }
        return this;
    };
    SuggestedActions.prototype.actions = function (list) {
        this.data.actions = [];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                this.addAction(list[i]);
            }
        }
        return this;
    };
    SuggestedActions.prototype.addAction = function (action) {
        if (action) {
            var cardAction = action.toAction ? action.toAction() : action;
            if (!this.data.actions) {
                this.data.actions = [cardAction];
            }
            else {
                this.data.actions.push(cardAction);
            }
        }
        return this;
    };
    SuggestedActions.prototype.toSuggestedActions = function () {
        return this.data;
    };
    SuggestedActions.create = function (session, actions, to) {
        return new SuggestedActions(session)
            .to(to)
            .actions(actions);
    };
    return SuggestedActions;
}());
exports.SuggestedActions = SuggestedActions;
