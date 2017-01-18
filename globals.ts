import * as builder from 'botbuilder';

export enum ConversationState {
    Bot,
    Waiting,
    Agent
}

export interface TranscriptLine {
    timestamp: string,
    from: any,
    text: string
}
 
export interface Conversation {
    customer: builder.IAddress,
    agent?: builder.IAddress,
    state: ConversationState,
    transcript: TranscriptLine[]
};

export const conversations: Conversation[] = [];

export interface Provider {
    // Create
    createNewCustomerConversation: (customerAddress: builder.IAddress) => Conversation;

    // Update
    addToTranscript: (conversationId: string, message: builder.IMessage) => void;
    connectCustomerConversationToAgent: (conversationId: string, address: builder.IAddress) => void;
    disconnectAgentFromCustomerConversation: (conversationId: string) => void;
    updateCustomerConversationState: (customerId: string, newState: ConversationState) => void;
    
    // Get
    findCustomerConversationWaitingLongest: () => any;
    findCustomerConversationByName: (inputWords: string[]) => any;
    findCurrentAgentConversation: (agentConversationId: string) => any;
    getCustomerConversationById: (conversationId: string) => any;
    listCurrentConversations: () => any;
}
