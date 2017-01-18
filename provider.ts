import * as builder from 'botbuilder';
import { Provider, conversations, ConversationState } from './globals';


// Create
const createNewCustomerConversation = (customerAddress: builder.IAddress) => {
    const conversation = {
        customer: customerAddress,
        state: ConversationState.Bot,
        transcript: []
    };
    conversations.push(conversation);
    return conversation;
}

// Update
const addToTranscript = (conversationId: string, message: builder.IMessage) => {
    const conversation = getCustomerConversationById(conversationId);

    if (conversation) {
        conversation.transcript.push({
            timestamp: message.timestamp,
            from: message.address,
            text: message.text
        });
    }
}

const connectCustomerConversationToAgent = (conversationId: string, address: builder.IAddress) => {
    const conversation = getCustomerConversationById(conversationId);

    if (conversation) {
        conversation.state = ConversationState.Agent;
        conversation.agent = address;
    }
}

const updateCustomerConversationState = (conversationId: string, newState: ConversationState) => {
    const conversation = getCustomerConversationById(conversationId);
     conversation.state = newState;

}

const disconnectAgentFromCustomerConversation = (customerId: string) => {
    const conversation = getCustomerConversationById(customerId);
    conversation.state = ConversationState.Bot;
    delete conversation.agent;
}

// Get
const findCurrentAgentConversation = (agentConversationId: string) => {
    const conversation = conversations.find(conversation =>
        conversation.agent && conversation.agent.conversation.id === agentConversationId
    );
    return conversation;
}

const getCustomerConversationById = (conversationId: string) => {
    const conversation = conversations.find(conversation =>
        conversation.customer.conversation.id === conversationId
    );
    return conversation
}
const findCustomerConversationByName = (inputWords: string[]) => {
    let customerNameInArray = inputWords.slice(1);
    let customerName = customerNameInArray.join(' ');
    let grabbedUser = conversations.find(conversation =>
        conversation.customer.user.name === customerName
    );
    return grabbedUser;
}

const findCustomerConversationWaitingLongest = () => {
    let waitingConversations = conversations.filter((x) => x.state === ConversationState.Waiting);
    if (waitingConversations.length === 0) {
        return;
    } else {
        waitingConversations.sort((x, y) => Date.parse(y.transcript[y.transcript.length - 1].timestamp) - Date.parse(x.transcript[x.transcript.length - 1].timestamp))
        return waitingConversations[0];
    }
}

const listCurrentConversations = () => {
    if (conversations.length === 0) {
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

    return text;
}

export const defaultProvider: Provider = {
    // Create
    createNewCustomerConversation,

    // Update
    addToTranscript,
    connectCustomerConversationToAgent,
    disconnectAgentFromCustomerConversation,
    updateCustomerConversationState,

    // Get
    findCustomerConversationByName,
    findCurrentAgentConversation,
    getCustomerConversationById,
    listCurrentConversations,
    findCustomerConversationWaitingLongest,

}



