import * as builder from 'botbuilder';
import { Conversation, ConversationState, Handoff } from './handoff';

export function commandsMiddleware(handoff: Handoff) {
    return {
        botbuilder: (session: builder.Session, next: Function) => {
            if (session.message.type === 'message') {
                command(session, next, handoff);
            }
        }
    }
}

function command(
    session: builder.Session,
    next: Function,
    handoff: Handoff
) {
    if (handoff.isAgent(session)) {
        agentCommand(session, next, handoff);
    } else {
        customerCommand(session, next, handoff);
    }
}

function agentCommand(
    session: builder.Session,
    next: Function,
    handoff: Handoff
) {
    const message = session.message;
    const conversation = handoff.getConversation({ agentConversationId: message.address.conversation.id });
    const inputWords = message.text.split(' ');

    if (inputWords.length == 0)
        return;

    if (message.text === 'disconnect') {
        disconnectCustomer(conversation, handoff, session);
        return;
    }

    // Commands to execute whether connected to a customer or not
    switch (inputWords[0]) {
        case 'options':
            sendAgentCommandOptions(session);
            return;
        case 'list':
            session.send(currentConversations(handoff));
            return;
        case 'history':
            handoff.getCustomerTranscript(
                inputWords.length > 1
                    ? { customerName: inputWords.slice(1).join(' ') }
                    : { agentConversationId: message.address.conversation.id },
                session);
            return;
        case 'waiting':
            if (conversation) {
                //disconnect from current conversation if already watching/talking
                disconnectCustomer(conversation, handoff, session);
            }
            const waitingConversation = handoff.connectCustomerToAgent(
                { bestChoice: true },
                ConversationState.Agent,
                message.address
            );
            if (waitingConversation) {
                session.send("You are connected to " + waitingConversation.customer.user.name);
            } else {
                session.send("No customers waiting.");
            }
            return;
        case 'connect':
        case 'watch':
            let newConversation;
            if (inputWords[0] === 'connect') {
                newConversation = handoff.connectCustomerToAgent(
                    inputWords.length > 1
                        ? { customerName: inputWords.slice(1).join(' ') }
                        : { customerConversationId: conversation.customer.conversation.id },
                    ConversationState.Agent,
                    message.address
                );
            } else {
                // watch currently only supports specifying a customer to watch
                newConversation = handoff.connectCustomerToAgent(
                    { customerName: inputWords.slice(1).join(' ') },
                    ConversationState.Watch,
                    message.address
                );
            }

            if (newConversation) {
                session.send("You are connected to " + newConversation.customer.user.name);
                return;
            } else {
                session.send("something went wrong.");
            }
            return;
        default:
            // TODO a better way to advance middleware in agent state while allowing for commands
            if (conversation && conversation.state === ConversationState.Agent) {
                return next();
            }
            sendAgentCommandOptions(session);
            return;
    }
}

function customerCommand(session: builder.Session, next: Function, handoff: Handoff) {
    const message = session.message;
    if (message.text === 'help') {
        // lookup the conversation (create it if one doesn't already exist)
        const conversation = handoff.getConversation({ customerConversationId: message.address.conversation.id }, message.address);

        if (conversation.state == ConversationState.Bot) {
            handoff.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, message.text);
            handoff.queueCustomerForAgent({ customerConversationId: conversation.customer.conversation.id })
            session.send("Connecting you to the next available agent.");
            return;
        }
    }

    return next();
}


function sendAgentCommandOptions(session: builder.Session) {
    const commands = ' ### Agent Options\n - Type *waiting* to connect to customer who has been waiting longest.\n - Type *connect { user name }* to connect to a specific conversation\n - Type *watch { user name }* to monitor a customer conversation\n - Type *history { user name }* to see a transcript of a given user\n - Type *history* while watching or talking to a customer to see their transcript\n - Type *list* to see a list of all current conversations.\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
    session.send(commands);
    return;
}

function currentConversations(handoff) {
    const conversations = handoff.currentConversations();
    if (conversations.length === 0) {
        return "No customers are in conversation.";
    }

    let text = '### Current Conversations \n';
    // TODO is it worth reworking to see which agent is talking to each customer?
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
        }
    });

    return text;
}

function disconnectCustomer(conversation: Conversation, handoff: any, session: builder.Session) {
    if (handoff.connectCustomerToBot({ customerConversationId: conversation.customer.conversation.id })) {
        session.send("Customer " + conversation.customer.user.name + " is now connected to the bot.");
    }

}
