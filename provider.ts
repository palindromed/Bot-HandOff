import * as builder from 'botbuilder';
import { By, Conversation, ConversationState, Provider, TranscriptLine } from './handoff';

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

const connectCustomerToAgent = (by: By, agentAddress: builder.IAddress, nextState?: ConversationState) => {
    const conversation = getConversation(by);
    if (conversation) {
        if (by.bestChoice) {
            conversation.state = conversation.state === ConversationState.Waiting ? ConversationState.Agent : ConversationState.Resolve;
        } else {
            conversation.state = nextState;
        }
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

const changeStateToResolve = (by: By) => {
    const conversation = getConversation(by);
    if (!conversation)
        return false;

    conversation.state = ConversationState.Resolve;

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
    // local function to create a conversation if customer does not already have one
    const createConversation = (customerAddress: builder.IAddress) => {
        const conversation: Conversation = {
            customer: customerAddress,
            customerConversationId: customerAddress.conversation.id,
            state: ConversationState.Bot,
            transcript: [],
        };
        conversations.push(conversation);
        return conversation;
    }

    if (by.bestChoice) {
        const waitingLongest: Conversation[] = conversations
            .filter(conversation => conversation.state === ConversationState.Waiting || conversation.state === ConversationState.Resolve && !conversation.agent)
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

const await = (customerConversationId: string, resolve: Function, reject: Function, toResolve?: builder.Message) => {
    conversations.map((conversation) => {
        if (conversation.customerConversationId === customerConversationId) {
            conversation.transcript[conversation.transcript.length - 1].toResolve = toResolve;
            conversation.transcript[conversation.transcript.length - 1].deferred = {
                resolve: resolve,
                reject: reject
            };
        }
        return conversation;
    });
}

const currentConversations = () =>
    conversations;

export const defaultProvider: Provider = {
    init,
    // Supervised Handoff
    await,
    // Update
    addToTranscript,
    connectCustomerToAgent,
    connectCustomerToBot,
    queueCustomerForAgent,
    changeStateToResolve,
    // Get
    getConversation,
    currentConversations
}
