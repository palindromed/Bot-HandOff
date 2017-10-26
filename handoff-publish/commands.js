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
const handoff_1 = require("./handoff");
const indexExports = require('./index');
function commandsMiddleware(bot, handoff) {
    return {
        botbuilder: (session, next) => {
            if (session.message.type === 'message') {
                command(session, next, handoff, bot);
            }
            else {
                // allow messages of non 'message' type through 
                next();
            }
        }
    };
}
exports.commandsMiddleware = commandsMiddleware;
function command(session, next, handoff, bot) {
    if (handoff.isAgent(session)) {
        agentCommand(session, next, handoff, bot);
    }
    else {
        customerCommand(session, next, handoff);
    }
}
function agentCommand(session, next, handoff, bot) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = session.message;
        const conversation = yield handoff.getConversation({ agentConversationId: message.address.conversation.id });
        const inputWords = message.text.split(' ');
        if (inputWords.length == 0)
            return;
        // Commands to execute whether connected to a customer or not
        switch (inputWords[0]) {
            case 'options':
                sendAgentCommandOptions(session);
                return;
            case 'list':
                session.send(yield currentConversations(handoff));
                return;
            case 'history':
                yield handoff.getCustomerTranscript(inputWords.length > 1
                    ? { customerId: inputWords.slice(1).join(' ') }
                    : { agentConversationId: message.address.conversation.id }, session);
                return;
            case 'waiting':
                if (conversation) {
                    //disconnect from current conversation if already talking
                    disconnectCustomer(conversation, handoff, session, bot);
                }
                const waitingConversation = yield handoff.connectCustomerToAgent({ bestChoice: true }, message.address);
                if (waitingConversation) {
                    session.send(`You are connected to ${waitingConversation.customer.user.name} (${waitingConversation.customer.user.id})`);
                }
                else {
                    session.send("No customers waiting.");
                }
                return;
            case 'connect':
                const newConversation = yield handoff.connectCustomerToAgent(inputWords.length > 1
                    ? { customerId: inputWords.slice(1).join(' ') }
                    : { bestChoice: true }, message.address);
                if (newConversation) {
                    session.send(`You are connected to ${newConversation.customer.user.name} (${newConversation.customer.user.id})`);
                }
                else {
                    session.send("No customers waiting.");
                }
                if (message.text === 'disconnect') {
                    disconnectCustomer(conversation, handoff, session, bot);
                }
                return;
            case 'disconnect':
                disconnectCustomer(conversation, handoff, session, bot);
                return;
            default:
                return next();
        }
    });
}
function customerCommand(session, next, handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = session.message;
        const customerStartHandoffCommandRegex = new RegExp("^" + indexExports._customerStartHandoffCommand + "$", "gi");
        if (customerStartHandoffCommandRegex.test(message.text)) {
            // lookup the conversation (create it if one doesn't already exist)
            const conversation = yield handoff.getConversation({ customerConversationId: message.address.conversation.id }, message.address);
            if (conversation.state == handoff_1.ConversationState.Bot) {
                yield handoff.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, message);
                yield handoff.queueCustomerForAgent({ customerConversationId: conversation.customer.conversation.id });
                session.endConversation("Connecting you to the next available agent.");
                return;
            }
        }
        return next();
    });
}
function sendAgentCommandOptions(session) {
    const commands = ' ### Agent Options\n - Type *waiting* to connect to customer who has been waiting longest.\n - Type *connect { user id }* to connect to a specific conversation\n - Type *history { user id }* to see a transcript of a given user\n - Type *list* to see a list of all current conversations.\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
    session.send(commands);
    return;
}
function currentConversations(handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        const conversations = yield handoff.getCurrentConversations();
        if (conversations.length === 0) {
            return "No customers are in conversation.";
        }
        let text = '### Current Conversations \n';
        text += "Please use the user's ID to connect with them.\n\n";
        conversations.forEach(conversation => {
            const starterText = ` - *${conversation.customer.user.name} (ID: ${conversation.customer.user.id})*`;
            switch (handoff_1.ConversationState[conversation.state]) {
                case 'Bot':
                    text += starterText + ' is talking to the bot\n';
                    break;
                case 'Agent':
                    text += starterText + ' is talking to an agent\n';
                    break;
                case 'Waiting':
                    text += starterText + ' is waiting to talk to an agent\n';
                    break;
            }
        });
        return text;
    });
}
function disconnectCustomer(conversation, handoff, session, bot) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield handoff.connectCustomerToBot({ customerConversationId: conversation.customer.conversation.id })) {
            //Send message to agent
            session.send(`Customer ${conversation.customer.user.name} (${conversation.customer.user.id}) is now connected to the bot.`);
            if (bot) {
                //Send message to customer
                var reply = new builder.Message()
                    .address(conversation.customer)
                    .text('Agent has disconnected, you are now speaking to the bot.');
                bot.send(reply);
            }
        }
    });
}
//# sourceMappingURL=commands.js.map