import * as builder from 'botbuilder';

export enum ConversationState {
    Bot,
    Waiting,
    Agent
}

export interface TranscriptLine {
    timestamp: any,
    from: any,
    text: string
}
 
export interface Conversation {
    customer: builder.IAddress,
    agent?: builder.IAddress,
    state: ConversationState,
    transcript: TranscriptLine[]
};

export interface By {
    bestChoice?: true,
    agentConversationId?: string,
    customerConversationId?: string,
    customerName?: string
}

export interface Provider {
    init();

    // Create
    createConversation: (customerAddress: builder.IAddress) => Conversation;

    // Update
    addToTranscript: (by: By, text: string) => boolean;
    connectCustomerToAgent: (by: By, agentAddress: builder.IAddress) => boolean;
    connectCustomerToBot: (by: By) => boolean;
    queueCustomerForAgent: (by: By) => boolean;
    
    // Get
    getConversation: (by: By) => Conversation;
    currentConversations: () => Conversation[];
}
