export interface Conversation {
    conversationId: string,
    address: any,
    targetAddress: any
    transcript: any[]
};

export const conversations: Conversation[] = [];
export const agent: any[] = [];
export const users: any[] = [];
