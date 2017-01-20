import * as builder from 'botbuilder';
import { Express } from 'express';
import { defaultProvider } from './provider';

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

    // Update
    addToTranscript: (by: By, text: string) => boolean;
    connectCustomerToAgent: (by: By, agentAddress: builder.IAddress) => Conversation;
    connectCustomerToBot: (by: By) => boolean;
    queueCustomerForAgent: (by: By) => boolean;
    
    // Get
    getConversation: (by: By, customerAddress?: builder.IAddress) => Conversation;
    currentConversations: () => Conversation[];
}

export class Handoff {
    constructor(
        private bot: builder.UniversalBot,
        public isAgent: (session: builder.Session) => boolean,
        private provider = defaultProvider
    ) {
        this.provider.init();
    }

    public routingMiddleware() {
        return {
            botbuilder: (session: builder.Session, next: Function) => {
                if (session.message.type === 'message') {
                    this.routeMessage(session, next);
                }
            },
            send: (event: builder.IEvent, next: Function) => {
                this.trancribeMessageFromBot(event as builder.IMessage, next);
            }
        }
    }

    private routeMessage(
        session: builder.Session,
        next: Function
    ) {
        if (this.isAgent(session)) {
            console.log("agent");
            this.routeAgentMessage(session)
        } else {
            console.log("customer");
            this.routeCustomerMessage(session, next);
        }
    }

    private routeAgentMessage(session: builder.Session) {
        const message = session.message;
        const conversation = this.getConversation({ agentConversationId: message.address.conversation.id });

        if (!conversation)
            return;

        if (conversation.state !== ConversationState.Agent) {
            // error state -- should not happen
            session.send("Shouldn't be in this state - agent should have been cleared out.");
            console.log("Shouldn't be in this state - agent should have been cleared out");
            return;
        }

        this.bot.send(new builder.Message().address(conversation.customer).text(message.text));
    }

    private routeCustomerMessage(session: builder.Session, next: Function) {
        const message = session.message;
        const conversation = this.getConversation({ customerConversationId: message.address.conversation.id }, message.address);
        this.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, message.text);

        switch (conversation.state) {
            case ConversationState.Bot:
                return next();
            case ConversationState.Waiting:
                session.send("Connecting you to the next available agent.");
                return;
            case ConversationState.Agent:
                if (!conversation.agent) {
                    session.send("No agent address present while customer in state Agent");
                    console.log("No agent address present while customer in state Agent");
                    return;
                }
                this.bot.send(new builder.Message().address(conversation.agent).text(message.text));
                return;
        }
    }

    private trancribeMessageFromBot(message: builder.IMessage, next: Function) {
        this.provider.addToTranscript({ customerConversationId: message.address.conversation.id }, message.text);
        next();
    }

    public connectCustomerToAgent = (by: By, agentAddress: builder.IAddress) =>
        this.provider.connectCustomerToAgent(by, agentAddress);

    public connectCustomerToBot = (by: By) =>
        this.provider.connectCustomerToBot(by);

    public queueCustomerForAgent = (by: By) =>
        this.provider.queueCustomerForAgent(by);

    public addToTranscript = (by: By, text: string) =>
        this.provider.addToTranscript(by, text);

    public getConversation = (by: By, customerAddress?: builder.IAddress) =>
        this.provider.getConversation(by, customerAddress);
    
    public currentConversations = () =>
        this.provider.currentConversations();

};
