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
    addToTranscript: (conversationId: string, message: builder.IMessage) => void;
    connectCustomerToAgent: (conversationId: string, address: builder.IAddress) => void;
    connectToWaitingCustomer: (session: builder.Session) ;

}
