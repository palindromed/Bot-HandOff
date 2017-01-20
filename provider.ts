import * as builder from 'botbuilder';
import { Provider, Conversation, By, ConversationState } from './handoff';

export let conversations: Conversation[];

export const init = () => {
    conversations = [];
}

// Update
const addToTranscript = (by: By, text: string) => {
    const conversation = getConversation(by);
    if (!conversation)
        return false;

    conversation.transcript.push({
        timestamp: Date.now(),
        from: by.agentConversationId ? 'agent' : 'customer',
        text
    });

    return true;
}

const connectCustomerToAgent = (by: By, agentAddress: builder.IAddress) => {
    const conversation = getConversation(by);
    if (conversation) {
        conversation.state = ConversationState.Agent;
        conversation.agent = agentAddress;
    }

    return conversation;
}

const queueCustomerForAgent = (by: By) => {
    const conversation = getConversation(by);
    if (!conversation)
        return false;

    conversation.state = ConversationState.Waiting;
    if (conversation.agent)
        delete conversation.agent;

    return true;
}

const connectCustomerToBot = (by: By) => {
    const conversation = getConversation(by);
    if (!conversation)
        return false;

    conversation.state = ConversationState.Bot;
    if (conversation.agent)
        delete conversation.agent;

    return true;
}

// Get
const getConversation = (
    by: By,
    customerAddress?: builder.IAddress // if looking up by customerConversationId, create new conversation if one doesn't already exist
) => {
    const createConversation = (customerAddress: builder.IAddress) => {
        console.log("creating customer conversation");
        const conversation = {
            customer: customerAddress,
            state: ConversationState.Bot,
            transcript: []
        };
        conversations.push(conversation);
        return conversation;
    }

    if (by.bestChoice) {
        const waitingLongest = conversations
            .filter(conversation => conversation.state === ConversationState.Waiting)
            .sort((x, y) => y.transcript[y.transcript.length - 1].timestamp - x.transcript[x.transcript.length - 1].timestamp);
        return waitingLongest.length > 0 && waitingLongest[0];
    }
    if (by.customerName) {
        return conversations.find(conversation =>
            conversation.customer.user.name == by.customerName
        );
    } else if (by.agentConversationId) {
        return conversations.find(conversation =>
            conversation.agent && conversation.agent.conversation.id === by.agentConversationId
        );
    } else if (by.customerConversationId) {
        let conversation = conversations.find(conversation =>
            conversation.customer.conversation.id === by.customerConversationId
        );
        if (!conversation && customerAddress) {
            conversation = createConversation(customerAddress);
        }
        return conversation;
    }
    return null;
}

const currentConversations = () => 
    conversations;

export const defaultProvider: Provider = {
    init,

    // Update
    addToTranscript,
    connectCustomerToAgent,
    connectCustomerToBot,
    queueCustomerForAgent,

    // Get
    getConversation,
    currentConversations,
}



