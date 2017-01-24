import * as builder from 'botbuilder';
import { Express } from 'express';
import { defaultProvider } from './provider';

// Options for state of a conversation
// Customer talking to bot, waiting for next available agent or talking to an agent
export enum ConversationState {
    Bot,
    Waiting,
    Agent
}

// What an entry in the customer transcript will have
export interface TranscriptLine {
    timestamp: any,
    from: any,
    text: string
}

// What is stored in a conversation. Agent only included if customer is talking to an agent
export interface Conversation {
    customer: builder.IAddress,
    agent?: builder.IAddress,
    state: ConversationState,
    transcript: TranscriptLine[]
};

// Used in getConversation in provider. Gives context to the search and changes behavior
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
    // if customizing, pass in your own check for isAgent and your own versions of methods in defaultProvider
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
                // Pass incoming messages to routing method
                if (session.message.type === 'message') {
                    this.routeMessage(session, next);
                }
            },
            send: (event: builder.IEvent, next: Function) => {
                // Messages sent from the bot do not need to be routed
                this.trancribeMessageFromBot(event as builder.IMessage, next);
            }
        }
    }

    private routeMessage(
        session: builder.Session,
        next: Function
    ) {
        if (this.isAgent(session)) {
            this.routeAgentMessage(session)
        } else {
            this.routeCustomerMessage(session, next);
        }
    }

    private routeAgentMessage(session: builder.Session) {
        const message = session.message;
        const conversation = this.getConversation({ agentConversationId: message.address.conversation.id });

        // if the agent is not in conversation, no further routing is necessary
        if (!conversation)
            return;

        if (conversation.state !== ConversationState.Agent) {
            // error state -- should not happen
            session.send("Shouldn't be in this state - agent should have been cleared out.");
            console.log("Shouldn't be in this state - agent should have been cleared out");
            return;
        }
        // send text that agent typed to the customer they are in conversation with
        this.bot.send(new builder.Message().address(conversation.customer).text(message.text));
    }

    private routeCustomerMessage(session: builder.Session, next: Function) {
        const message = session.message;
        // method will either return existing conversation or a newly created conversation if this is first time we've heard from customer
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

    // These methods are wrappers around provider which handles data
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
