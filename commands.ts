import { Middleware } from 'botbuilder';
import { Conversation, ConversationState, Handoff } from './handoff';
import { ConversationReference } from 'botbuilder';
import { NextFunc } from './util';


export function commandsMiddleware(handoff: Handoff): Middleware {
    return {
        receiveActivity: (context: BotContext, next: NextFunc<void>) => {
            if (context.request.type === 'message') {
                return command(context, next, handoff);
            }
            return next();
        }
    }
}

function command(
    context: BotContext,
    next: NextFunc<void>,
    handoff: Handoff
) {
    if (handoff.isAgent(context)) {
        return agentCommand(context, next, handoff);
    } else {
        return customerCommand(context, next, handoff);
    }
}

function agentCommand(
    context: BotContext,
    next: NextFunc<void>,
    handoff: Handoff
): Promise<void> {
    const request = context.request;
    const conversation = handoff.getConversation({ agentConversationId: context.conversationReference.conversation.id });
    const inputWords = request.text.split(' ');

    if (inputWords.length == 0)
        return Promise.resolve();

    if (request.text === 'disconnect') {
        disconnectCustomer(conversation, handoff, context);
        return Promise.resolve();
    }

    // Commands to execute whether connected to a customer or not
    switch (inputWords[0]) {
        case 'options':
            sendAgentCommandOptions(context);
            return Promise.resolve();
        case 'list':
            context.reply(currentConversations(handoff));
            return Promise.resolve();
        case 'history':
            handoff.getCustomerTranscript(
                inputWords.length > 1
                    ? { customerName: inputWords.slice(1).join(' ') }
                    : { agentConversationId: request.conversation.id },
                context);
            return Promise.resolve();
        case 'waiting':
            if (conversation) {
                //disconnect from current conversation if already watching/talking
                disconnectCustomer(conversation, handoff, context);
            }
            const waitingConversation = handoff.connectCustomerToAgent(
                { bestChoice: true },
                ConversationState.Agent,
                context.conversationReference as ConversationReference
            );
            if (waitingConversation) {
                context.reply("You are connected to " + waitingConversation.customer.user.name);
            } else {
                context.reply("No customers waiting.");
            }
            return Promise.resolve();
        case 'connect':
        case 'watch':
            let newConversation;
            if (inputWords[0] === 'connect') {
                newConversation = handoff.connectCustomerToAgent(
                    inputWords.length > 1
                        ? { customerName: inputWords.slice(1).join(' ') }
                        : { customerConversationId: conversation.customer.conversation.id },
                    ConversationState.Agent,
                    context.conversationReference as ConversationReference
                );
            } else {
                // watch currently only supports specifying a customer to watch
                newConversation = handoff.connectCustomerToAgent(
                    { customerName: inputWords.slice(1).join(' ') },
                    ConversationState.Watch,
                    context.conversationReference as ConversationReference
                );
            }

            if (newConversation) {
                context.reply("You are connected to " + newConversation.customer.user.name);
                return Promise.resolve();
            } else {
                context.reply("something went wrong.");
            }
            return Promise.resolve();
        default:
            if (conversation && conversation.state === ConversationState.Agent) {
                return next();
            }
            sendAgentCommandOptions(context);
            return Promise.resolve();
    }
}

function customerCommand(context: BotContext, next: NextFunc<void>, handoff: Handoff): Promise<void> {
    const request = context.request;
    if (request.text === 'help') {
        // lookup the conversation (create it if one doesn't already exist)
        const conversation = handoff.getConversation({ customerConversationId: request.conversation.id }, context.conversationReference as ConversationReference);

        if (conversation.state == ConversationState.Bot) {
            handoff.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, request.text);
            handoff.queueCustomerForAgent({ customerConversationId: conversation.customer.conversation.id })
            context.reply("Connecting you to the next available agent.");
            return Promise.resolve();
        }
    }

    return next();
}


function sendAgentCommandOptions(context: BotContext) {
    const commands = ' ### Agent Options\n - Type *waiting* to connect to customer who has been waiting longest.\n - Type *connect { user name }* to connect to a specific conversation\n - Type *watch { user name }* to monitor a customer conversation\n - Type *history { user name }* to see a transcript of a given user\n - Type *list* to see a list of all current conversations.\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
    context.reply(commands);
    return;
}

function currentConversations(handoff: Handoff) {
    const conversations = handoff.currentConversations();
    if (conversations.length === 0) {
        return "No customers are in conversation.";
    }

    let text = '### Current Conversations \n';
    conversations.forEach(conversation => {
        const starterText = ' - *' + conversation.customer.user.name + '*';
        switch (ConversationState[conversation.state]) {
            case 'Bot':
                text += starterText + ' is talking to the bot\n';
                break;
            case 'Agent':
                text += starterText + ' is talking to an agent\n';
                break;
            case 'Waiting':
                text += starterText + ' is waiting to talk to an agent\n';
                break;
            case 'Watch':
                text += starterText + ' is being monitored by an agent\n';
                break;
        }
    });

    return text;
}

function disconnectCustomer(conversation: Conversation, handoff: any, context: BotContext) {
    if (handoff.connectCustomerToBot({ customerConversationId: conversation.customer.conversation.id })) {
        context.reply("Customer " + conversation.customer.user.name + " is now connected to the bot.");
    }
}
