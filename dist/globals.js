"use strict";
var ConversationState;
(function (ConversationState) {
    ConversationState[ConversationState["Bot"] = 0] = "Bot";
    ConversationState[ConversationState["Waiting"] = 1] = "Waiting";
    ConversationState[ConversationState["Agent"] = 2] = "Agent";
})(ConversationState = exports.ConversationState || (exports.ConversationState = {}));
;
exports.conversations = [];
