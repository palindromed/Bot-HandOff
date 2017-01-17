import * as builder from 'botbuilder';
import { Provider, TranscriptLine, conversations, ConversationState, Conversation } from './globals';

export const getCustomerById = (conversationId: string) => {
    const conversation = conversations.find(conversation =>
        conversation.customer.conversation.id === conversationId
    );
    return conversation
}

const addToTranscript = (conversationId: string, message: builder.IMessage) => {
    const conversation = getCustomerById(conversationId);

    if (conversation) {
        console.log("transcribing message", message);
        conversation.transcript.push({
            timestamp: message.timestamp,
            from: message.address,
            text: message.text
        });
    }
}

const connectCustomerToAgent = (conversationId: string, address: builder.IAddress) => {
    const conversation = getCustomerById(conversationId);

    if (conversation) {
        conversation.state = ConversationState.Agent;
        conversation.agent = address;
    }
}

const connectToWaitingCustomer = (session: builder.Session) => {
    let waitingConversations = conversations.filter((x) => x.state === ConversationState.Waiting);
    console.log('customers in Waiting state: ', waitingConversations);
    if (waitingConversations.length === 0) {
        session.send("No users waiting");
        return;
    } else {
        // TODO change to a non mutating method
        waitingConversations.sort((x, y) => Date.parse(y.transcript[y.transcript.length - 1].timestamp) - Date.parse(x.transcript[x.transcript.length - 1].timestamp))
        return waitingConversations[0];
    }

    /*
    const  listCurrentConversations = (session: builder.Session) => {
            if (conversations.length === 0) {
                session.send("No customers are in conversation.");
                return;
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
    
            session.send(text);
        }
    */
    export const defaultProvider: Provider = {
        addToTranscript,
        connectCustomerToAgent,

    }



