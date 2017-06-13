import * as builder from 'botbuilder';
import { Provider, Conversation, By, ConversationState } from './handoff';

export let conversations: Conversation[];

export const  init = async () => {
    conversations = [];
}

const convertToPromise = <T>(value: T): Promise<T> => {
    return new Promise<T>((resolve) => { return resolve(value) });
}

// Update

const addToTranscript = async (by: By, message: builder.IMessage, from: string): Promise<boolean> => {
    const conversation = await getConversation(by);
    let text = message.text;
    if (!conversation)
        return convertToPromise<boolean>(false);

    conversation.transcript.push({
        timestamp: message.localTimestamp,
        from: by.agentConversationId ? 'Agent' : 'Customer',
        sentimentScore: 1,
        state: conversation.state,
        text
    });

    return convertToPromise<boolean>(true);
}

const connectCustomerToAgent = async (by: By, agentAddress: builder.IAddress): Promise<Conversation> => {
    const conversation = await getConversation(by);
    if (conversation) {
        conversation.state = ConversationState.Agent;
        conversation.agent = agentAddress;
    }

    return convertToPromise(conversation);
}

const queueCustomerForAgent = async (by: By) => {
    const conversation = await getConversation(by);
    if (!conversation)
        return convertToPromise(false);

    conversation.state = ConversationState.Waiting;
    if (conversation.agent)
        delete conversation.agent;

    return convertToPromise(true);
}

const connectCustomerToBot = async (by: By) => {
    const conversation = await getConversation(by);
    if (!conversation)
        return convertToPromise(false);

    conversation.state = ConversationState.Bot;
    if (conversation.agent)
        delete conversation.agent;

    return convertToPromise(true);
}

// Get
const getConversation = async (
    by: By,
    customerAddress?: builder.IAddress // if looking up by customerConversationId, create new conversation if one doesn't already exist
): Promise<Conversation> => {
    // local function to create a conversation if customer does not already have one
    const createConversation = (customerAddress: builder.IAddress) => {
        const conversation = {
            customer: customerAddress,
            state: ConversationState.Bot,
            transcript: []
        };
        conversations.push(conversation);
        return convertToPromise(conversation);
    }

    if (by.bestChoice) {
        const waitingLongest = conversations
            .filter(conversation => conversation.state === ConversationState.Waiting)
            .sort((x, y) => y.transcript[y.transcript.length - 1].timestamp - x.transcript[x.transcript.length - 1].timestamp);
        return await convertToPromise(waitingLongest.length > 0 && waitingLongest[0]);
    }
    if (by.customerName) {
        return convertToPromise(conversations.find(conversation =>
            conversation.customer.user.name == by.customerName
        ));
    } else if (by.agentConversationId) {
        return convertToPromise(conversations.find(conversation =>
            conversation.agent && conversation.agent.conversation.id === by.agentConversationId
        ));
    } else if (by.customerConversationId) {
        let conversation = conversations.find(conversation =>
            conversation.customer.conversation.id === by.customerConversationId
        );
        if (!conversation && customerAddress) {
            conversation = await createConversation(customerAddress);
        }
        return convertToPromise(conversation);
    }
    return null;
}

const getCurrentConversations = (): Promise<Conversation[]> =>
    convertToPromise(conversations);

export const defaultProvider: Provider = {
    init,

    // Update
    addToTranscript,
    connectCustomerToAgent,
    connectCustomerToBot,
    queueCustomerForAgent,

    // Get
    getConversation,
    getCurrentConversations,
}
