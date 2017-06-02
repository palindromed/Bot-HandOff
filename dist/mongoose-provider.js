"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const mongoose = require("mongoose");
exports.mongoose = mongoose;
mongoose.Promise = bluebird;
const handoff_1 = require("./handoff");
// -------------------
// Bot Framework types
// -------------------
exports.IIdentitySchema = new mongoose.Schema({
    id: { type: String, required: true },
    isGroup: { type: Boolean, required: false },
    name: { type: String, required: false },
}, {
    _id: false,
    strict: false,
});
exports.IAddressSchema = new mongoose.Schema({
    bot: { type: exports.IIdentitySchema, required: true },
    channelId: { type: String, required: true },
    conversation: { type: exports.IIdentitySchema, required: false },
    user: { type: exports.IIdentitySchema, required: true },
    id: { type: String, required: false },
    serviceUrl: { type: String, required: false },
    useAuth: { type: Boolean, required: false }
}, {
    strict: false,
    id: false,
    _id: false
});
// -------------
// Handoff types
// -------------
exports.TranscriptLineSchema = new mongoose.Schema({
    timestamp: {},
    from: String,
    text: String
});
exports.ConversationSchema = new mongoose.Schema({
    customer: { type: exports.IAddressSchema, required: true },
    agent: { type: exports.IAddressSchema, required: false },
    state: {
        type: Number,
        required: true,
        min: 0,
        max: 2
    },
    transcript: [exports.TranscriptLineSchema]
});
exports.ConversationModel = mongoose.model('Conversation', exports.ConversationSchema);
exports.BySchema = new mongoose.Schema({
    bestChoice: Boolean,
    agentConversationId: String,
    customerConversationId: String,
    customerName: String
});
exports.ByModel = mongoose.model('By', exports.BySchema);
// -----------------
// Mongoose Provider
// -----------------
class MongooseProvider {
    init() {
        //mongoose.connect(process.env.MONGODB_PROVIDER);
    }
    addToTranscript(by, text, from) {
        return __awaiter(this, void 0, void 0, function* () {
            const conversation = yield this.getConversation(by);
            if (!conversation)
                return false;
            conversation.transcript.push({
                timestamp: Date.now(),
                from: from,
                text
            });
            return yield this.updateConversation(conversation);
        });
    }
    connectCustomerToAgent(by, agentAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const conversation = yield this.getConversation(by);
            if (conversation) {
                conversation.state = handoff_1.ConversationState.Agent;
                conversation.agent = agentAddress;
            }
            const success = yield this.updateConversation(conversation);
            if (success)
                return conversation;
            else
                return null;
        });
    }
    queueCustomerForAgent(by) {
        return __awaiter(this, void 0, void 0, function* () {
            const conversation = yield this.getConversation(by);
            if (!conversation) {
                return false;
            }
            else {
                conversation.state = handoff_1.ConversationState.Waiting;
                return yield this.updateConversation(conversation);
            }
        });
    }
    connectCustomerToBot(by) {
        return __awaiter(this, void 0, void 0, function* () {
            const conversation = yield this.getConversation(by);
            if (!conversation) {
                return false;
            }
            else {
                conversation.state = handoff_1.ConversationState.Bot;
                if (conversation.agent) {
                    return yield this.deleteConversation(conversation);
                }
                else {
                    return yield this.updateConversation(conversation);
                }
            }
        });
    }
    getConversation(by, customerAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (by.customerName) {
                return yield exports.ConversationModel.findOne({ 'customer.user.name': by.customerName });
            }
            else if (by.agentConversationId) {
                const conversation = yield exports.ConversationModel.findOne({ 'agent.conversation.id': by.agentConversationId });
                if (conversation)
                    return conversation;
                else
                    return null;
            }
            else if (by.customerConversationId) {
                let conversation = yield exports.ConversationModel.findOne({ 'customer.conversation.id': by.customerConversationId });
                if (!conversation && customerAddress) {
                    conversation = yield this.createConversation(customerAddress);
                }
                return conversation;
            }
            return null;
        });
    }
    getCurrentConversations() {
        return __awaiter(this, void 0, void 0, function* () {
            let conversations;
            try {
                conversations = yield exports.ConversationModel.find();
            }
            catch (error) {
                console.log('Failed loading conversations');
                console.log(error);
            }
            return conversations;
        });
    }
    createConversation(customerAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield exports.ConversationModel.create({
                customer: customerAddress,
                state: handoff_1.ConversationState.Bot,
                transcript: []
            });
        });
    }
    updateConversation(conversation) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                exports.ConversationModel.findByIdAndUpdate(conversation._id, conversation).then((error) => {
                    resolve(true);
                }).catch((error) => {
                    console.log('Failed to update conversation');
                    console.log(conversation);
                    resolve(false);
                });
            });
        });
    }
    deleteConversation(conversation) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                exports.ConversationModel.findByIdAndRemove(conversation._id).then((error) => {
                    resolve(true);
                });
            });
        });
    }
}
exports.MongooseProvider = MongooseProvider;
//# sourceMappingURL=mongoose-provider.js.map