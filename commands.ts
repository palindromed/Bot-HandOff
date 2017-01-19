import * as builder from 'botbuilder';
import { Handoff } from './handoff';
import { ConversationState } from './globals';

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
    if (session.message.user.name.startsWith("Agent")) {
        console.log("agent command");
        agentCommand(session, next, handoff);
    } else {
        console.log("customer command");
        customerCommand(session, next, handoff);
    }
}

function agentCommand(
    session: builder.Session,
    next: Function,
    handoff: Handoff
) {
    const message = session.message;
    console.log("agentCommand start");
    const conversation = handoff.getConversation({ agentConversationId: message.address.conversation.id });
    console.log("agentCommand conversation", conversation);
    const inputWords = message.text.split(' ');

    if (inputWords.length == 0)
        return;

    if (inputWords[0] === 'options') {
        sendAgentCommandOptions(session);
        return;
    }

    if (!conversation) {
        console.log("checking for commands");
        switch (inputWords[0]) {
            case 'connect':
                if (!handoff.connectCustomerToAgent(
                    inputWords.length > 1
                        ? { customerName: inputWords.slice(1).join(' ') }
                        : { bestChoice: true },
                    message.address
                )) {
                    session.send("No customers waiting.");
                }
                break;
            case 'list':
                session.send(currentConversations(handoff));
                break;
            default:
                console.log("default options");
                sendAgentCommandOptions(session);
                break;
        }
        return;
    }

    if (conversation.state !== ConversationState.Agent) {
        // error state -- should not happen
        session.send("Shouldn't be in this state - agent should have been cleared out.");
        console.log("Shouldn't be in this state - agent should have been cleared out");
        return;
    }

    if (message.text === 'disconnect') {
        handoff.connectCustomerToBot(conversation.customer.conversation.id);
        return;
    }

    next();
}


function customerCommand(session: builder.Session, next: Function, handoff: Handoff) {
    const message = session.message;
    if (message.text === 'help') {
        let conversation = handoff.getConversation({ customerConversationId: message.address.conversation.id });

        if (!conversation) {
            // first time caller, long time listener
            conversation = handoff.createConversation(message.address);
        }

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
    const commands = ' ### Agent Options\n - Type *connect* to connect to customer who has been waiting longest.\n - Type *connect { user name }* to connect to a specific conversation\n - Type *list* to see a list of all current conversations.\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
    session.send(commands);
    return;
}

function currentConversations(handoff) {
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
        }
    });

    return text;
}

