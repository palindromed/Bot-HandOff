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
const builder = require("botbuilder");
const mongoose_provider_1 = require("./mongoose-provider");
// Options for state of a conversation
// Customer talking to bot, waiting for next available agent or talking to an agent
var ConversationState;
(function (ConversationState) {
    ConversationState[ConversationState["Bot"] = 0] = "Bot";
    ConversationState[ConversationState["Waiting"] = 1] = "Waiting";
    ConversationState[ConversationState["Agent"] = 2] = "Agent";
    ConversationState[ConversationState["Watch"] = 3] = "Watch";
})(ConversationState = exports.ConversationState || (exports.ConversationState = {}));
;
class Handoff {
    // if customizing, pass in your own check for isAgent and your own versions of methods in defaultProvider
    constructor(bot, isAgent, provider = new mongoose_provider_1.MongooseProvider()) {
        this.bot = bot;
        this.isAgent = isAgent;
        this.provider = provider;
        this.connectCustomerToAgent = (by, agentAddress) => __awaiter(this, void 0, void 0, function* () {
            return yield this.provider.connectCustomerToAgent(by, agentAddress);
        });
        this.connectCustomerToBot = (by) => __awaiter(this, void 0, void 0, function* () {
            return yield this.provider.connectCustomerToBot(by);
        });
        this.queueCustomerForAgent = (by) => __awaiter(this, void 0, void 0, function* () {
            return yield this.provider.queueCustomerForAgent(by);
        });
        this.addToTranscript = (by, message) => __awaiter(this, void 0, void 0, function* () {
            let from = by.agentConversationId ? 'Agent' : 'Customer';
            return yield this.provider.addToTranscript(by, message, from);
        });
        this.getConversation = (by, customerAddress) => __awaiter(this, void 0, void 0, function* () {
            return yield this.provider.getConversation(by, customerAddress);
        });
        this.getCurrentConversations = () => __awaiter(this, void 0, void 0, function* () {
            return yield this.provider.getCurrentConversations();
        });
        this.provider.init();
    }
    routingMiddleware() {
        return {
            botbuilder: (session, next) => {
                // Pass incoming messages to routing method
                if (session.message.type === 'message') {
                    this.routeMessage(session, next);
                }
                else {
                    // allow messages of non 'message' type through 
                    next();
                }
            },
            send: (event, next) => __awaiter(this, void 0, void 0, function* () {
                // Messages sent from the bot do not need to be routed
                // Not all messages from the bot are type message, we only want to record the actual messages  
                if (event.type === 'message' && !event.entities) {
                    this.transcribeMessageFromBot(event, next);
                }
                else {
                    //If not a message (text), just send to user without transcribing
                    next();
                }
            })
        };
    }
    routeMessage(session, next) {
        if (this.isAgent(session)) {
            this.routeAgentMessage(session);
        }
        else {
            this.routeCustomerMessage(session, next);
        }
    }
    routeAgentMessage(session) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = session.message;
            const conversation = yield this.getConversation({ agentConversationId: message.address.conversation.id }, message.address);
            yield this.addToTranscript({ agentConversationId: message.address.conversation.id }, message);
            // if the agent is not in conversation, no further routing is necessary
            if (!conversation)
                return;
            if (conversation.state !== ConversationState.Agent) {
                // error state -- should not happen
                session.send("Shouldn't be in this state - agent should have been cleared out.");
                return;
            }
            // send text that agent typed to the customer they are in conversation with
            this.bot.send(new builder.Message().address(conversation.customer).text(message.text).addEntity({ "agent": true }));
        });
    }
    routeCustomerMessage(session, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = session.message;
            // method will either return existing conversation or a newly created conversation if this is first time we've heard from customer
            const conversation = yield this.getConversation({ customerConversationId: message.address.conversation.id }, message.address);
            yield this.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, message);
            switch (conversation.state) {
                case ConversationState.Bot:
                    return next();
                case ConversationState.Waiting:
                    session.send("Connecting you to the next available agent.");
                    return;
                case ConversationState.Watch:
                    this.bot.send(new builder.Message().address(conversation.agent).text(message.text));
                    return next();
                case ConversationState.Agent:
                    if (!conversation.agent) {
                        session.send("No agent address present while customer in state Agent");
                        console.log("No agent address present while customer in state Agent");
                        return;
                    }
                    this.bot.send(new builder.Message().address(conversation.agent).text(message.text));
                    return;
            }
        });
    }
    // These methods are wrappers around provider which handles data
    transcribeMessageFromBot(message, next) {
        this.provider.addToTranscript({ customerConversationId: message.address.conversation.id }, message, 'Bot');
        next();
    }
}
exports.Handoff = Handoff;
;
//# sourceMappingURL=handoff.js.map