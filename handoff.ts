import * as builder from 'botbuilder';
import { Express } from 'express';
import { defaultProvider } from './provider';

// Options for state of a conversation
// Customer talking to bot, waiting for next available agent or talking to an agent
export enum ConversationState {
    Bot,
    Waiting,
    Agent,
    Watch
}

// What an entry in the customer transcript will have
export interface TranscriptLine {
    timestamp: any,
    from: string,
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
    addToTranscript: (by: By, text: string) => Promise<boolean>;
    connectCustomerToAgent: (by: By, nextState: ConversationState, agentAddress: builder.IAddress) => Promise<Conversation>;
    connectCustomerToBot: (by: By) => Promise<boolean>;
    queueCustomerForAgent: (by: By) => Promise<boolean>;

    // Get
    getConversation: (by: By, customerAddress?: builder.IAddress) => Promise<Conversation>;
    currentConversations: () => Promise<Conversation[]>;
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
            send: async (event: builder.IEvent, next: Function) => {
                // Messages sent from the bot do not need to be routed
                const message = event as builder.IMessage;
                const customerConversation = await this.getConversation({ customerConversationId: event.address.conversation.id });
                // send message to agent observing conversation
                if (customerConversation && customerConversation.state === ConversationState.Watch) {
                    this.bot.send(new builder.Message().address(customerConversation.agent).text(message.text));
                }
                this.trancribeMessageFromBot(message, next);

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

    private async routeAgentMessage(session: builder.Session) {
        const message = session.message;
        const conversation = await this.getConversation({ agentConversationId: message.address.conversation.id });

        // if the agent is not in conversation, no further routing is necessary
        if (!conversation)
            return;
        // if the agent is observing a customer, no need to route message
        if (conversation.state !== ConversationState.Agent)
            return;
        // send text that agent typed to the customer they are in conversation with
        this.bot.send(new builder.Message().address(conversation.customer).text(message.text));
    }

    private async routeCustomerMessage(session: builder.Session, next: Function) {
        const message = session.message;
        // method will either return existing conversation or a newly created conversation if this is first time we've heard from customer
        const conversation = await this.getConversation({ customerConversationId: message.address.conversation.id }, message.address);
        this.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, message.text);

        switch (conversation.state) {
            case ConversationState.Bot:
                return next();
            case ConversationState.Waiting:
                session.send("Connecting you to the next available agent.");
                return;
            case ConversationState.Watch:
                this.bot.send(new builder.Message().address(conversation.agent).text(message.text));
                return next();
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

     public async getCustomerTranscript(by: By, session: builder.Session) {
        const customerConversation = await this.getConversation(by);
        if (customerConversation) {
            customerConversation.transcript.forEach(transcriptLine =>
                session.send(transcriptLine.text));
        } else {
            session.send('No Transcript to show. Try entering a username or try again when connected to a customer');
        }
    }

    public connectCustomerToAgent = async (by: By, nextState: ConversationState, agentAddress: builder.IAddress) => {
        return await this.provider.connectCustomerToAgent(by, nextState, agentAddress);
    }

    public connectCustomerToBot = async (by: By) => {
        return await this.provider.connectCustomerToBot(by);
    }

    public queueCustomerForAgent = async (by: By) => {
        return await this.provider.queueCustomerForAgent(by);
    }

    public addToTranscript = async (by: By, text: string) => {
        return await this.provider.addToTranscript(by, text);
    }

    public getConversation = async (by: By, customerAddress?: builder.IAddress) => {
        return await this.provider.getConversation(by, customerAddress);
    }

    public currentConversations = async () => {
        return await this.provider.currentConversations();
    }
};
