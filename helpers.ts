import * as builder from 'botbuilder';
import { Conversation, ConversationState} from './handoff';

export function sendAgentCommandOptions(session: builder.Session) {
    const commands: string = ' ### Agent Options\n - Type *waiting* to connect to customer who has been waiting longest.\n - Type *connect { user name }* to connect to a specific conversation\n - Type *watch { user name }* to monitor a customer conversation\n - Type *history { user name }* to see a transcript of a given user\n - Type *list* to see a list of all current conversations.\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
    session.send(commands);
    return;
}

export function currentConversations(handoff) {
    const conversations: Conversation[] = handoff.currentConversations();
    if (conversations.length === 0) {
        return "No customers are in conversation.";
    }

    let text: string = '### Current Conversations \n';
    conversations.forEach(conversation => {
        const starterText: string = ' - *' + conversation.customer.user.name + '*';
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
            case 'Resolve':
                if (conversation.agent) {
                    text += starterText + ' is receiving supervised answers from an agent\n';
                } else {
                    text += starterText + ' is waiting to receive supervised answers from an agent\n';
                }
                break;
        }
    });

    return text;
}

export function disconnectCustomer(conversation: Conversation, handoff: any, session: builder.Session) {
    if (handoff.connectCustomerToBot({ customerConversationId: conversation.customer.conversation.id })) {
        session.send("Customer " + conversation.customer.user.name + " is now connected to the bot.");
    }
}
