"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MemoryBotStorage = (function () {
    function MemoryBotStorage() {
        this.userStore = {};
        this.conversationStore = {};
    }
    MemoryBotStorage.prototype.getData = function (context, callback) {
        var data = {};
        if (context.userId) {
            if (context.persistUserData) {
                if (this.userStore.hasOwnProperty(context.userId)) {
                    data.userData = JSON.parse(this.userStore[context.userId]);
                }
                else {
                    data.userData = null;
                }
            }
            if (context.conversationId) {
                var key = context.userId + ':' + context.conversationId;
                if (this.conversationStore.hasOwnProperty(key)) {
                    data.privateConversationData = JSON.parse(this.conversationStore[key]);
                }
                else {
                    data.privateConversationData = null;
                }
            }
        }
        if (context.persistConversationData && context.conversationId) {
            if (this.conversationStore.hasOwnProperty(context.conversationId)) {
                data.conversationData = JSON.parse(this.conversationStore[context.conversationId]);
            }
            else {
                data.conversationData = null;
            }
        }
        callback(null, data);
    };
    MemoryBotStorage.prototype.saveData = function (context, data, callback) {
        if (context.userId) {
            if (context.persistUserData) {
                this.userStore[context.userId] = JSON.stringify(data.userData || {});
            }
            if (context.conversationId) {
                var key = context.userId + ':' + context.conversationId;
                this.conversationStore[key] = JSON.stringify(data.privateConversationData || {});
            }
        }
        if (context.persistConversationData && context.conversationId) {
            this.conversationStore[context.conversationId] = JSON.stringify(data.conversationData || {});
        }
        callback(null);
    };
    MemoryBotStorage.prototype.deleteData = function (context) {
        if (context.userId && this.userStore.hasOwnProperty(context.userId)) {
            if (context.conversationId) {
                if (this.conversationStore.hasOwnProperty(context.conversationId)) {
                    delete this.conversationStore[context.conversationId];
                }
            }
            else {
                delete this.userStore[context.userId];
                for (var key in this.conversationStore) {
                    if (key.indexOf(context.userId + ':') == 0) {
                        delete this.conversationStore[key];
                    }
                }
            }
        }
    };
    return MemoryBotStorage;
}());
exports.MemoryBotStorage = MemoryBotStorage;
