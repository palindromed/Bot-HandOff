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
