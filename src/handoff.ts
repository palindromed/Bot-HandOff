import * as builder from 'botbuilder';
import { Express } from 'express';
import { MongooseProvider } from './mongoose-provider';

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
    sentimentScore: number,
    state: number,
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

    addToTranscript: (by: By, message: builder.IMessage, from: string) => Promise<boolean>;
    connectCustomerToAgent: (by: By, agentAddress: builder.IAddress) => Promise<Conversation>;
    connectCustomerToBot: (by: By) => Promise<boolean>;
    queueCustomerForAgent: (by: By) => Promise<boolean>;

    // Get
    getConversation: (by: By, customerAddress?: builder.IAddress) => Promise<Conversation>;
    getCurrentConversations: () => Promise<Conversation[]>;
}

export class Handoff {
    // if customizing, pass in your own check for isAgent and your own versions of methods in defaultProvider
    constructor(
        private bot: builder.UniversalBot,
        public isAgent: (session: builder.Session) => boolean,
        private provider = new MongooseProvider()
    ) {
        this.provider.init();
    }

    public routingMiddleware() {
        return {
            botbuilder: (session: builder.Session, next: Function) => {
                // Pass incoming messages to routing method
                if (session.message.type === 'message') {
                    this.routeMessage(session, next);
                } else {
                    // allow messages of non 'message' type through 
                    next();
                }
            },
            send: async (event: builder.IMessage, next: Function) => {
                // Messages sent from the bot do not need to be routed
                // Not all messages from the bot are type message, we only want to record the actual messages  
                if (event.type === 'message' && !event.entities) {
                    this.transcribeMessageFromBot(event as builder.IMessage, next);
                } else {
                    //If not a message (text), just send to user without transcribing
                    next();
                }
            }
        }
    }

    private routeMessage(session: builder.Session, next: Function) {
        if (this.isAgent(session)) {
            this.routeAgentMessage(session)
        } else {
            this.routeCustomerMessage(session, next);
        }
    }

    private async routeAgentMessage(session: builder.Session) {
        const message = session.message;
        const conversation = await this.getConversation({ agentConversationId: message.address.conversation.id }, message.address);
        await this.addToTranscript({ agentConversationId: message.address.conversation.id }, message);
        // if the agent is not in conversation, no further routing is necessary
        if (!conversation)
            return;

        if (conversation.state !== ConversationState.Agent) {
            // error state -- should not happen
            session.send("Shouldn't be in this state - agent should have been cleared out.");
            return;
        }
        // send text that agent typed to the customer they are in conversation with
        this.bot.send(new builder.Message().address(conversation.customer).text(message.text).addEntity({ "agent": true }));
    }

    private async routeCustomerMessage(session: builder.Session, next: Function) {
        const message = session.message;
        // method will either return existing conversation or a newly created conversation if this is first time we've heard from customer
        const conversation = await this.getConversation({ customerConversationId: message.address.conversation.id }, message.address);
        await this.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, message);

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
    private transcribeMessageFromBot(message: builder.IMessage, next: Function) {
        this.provider.addToTranscript({ customerConversationId: message.address.conversation.id }, message, 'Bot');
        next();
    }

    public connectCustomerToAgent = async (by: By, agentAddress: builder.IAddress): Promise<Conversation> => {
        return await this.provider.connectCustomerToAgent(by, agentAddress);
    }

    public connectCustomerToBot = async (by: By): Promise<boolean> => {
        return await this.provider.connectCustomerToBot(by);
    }

    public queueCustomerForAgent = async (by: By): Promise<boolean> => {
        return await this.provider.queueCustomerForAgent(by);
    }

    public addToTranscript = async (by: By, message: builder.IMessage): Promise<boolean> => {
        let from = by.agentConversationId ? 'Agent' : 'Customer';
        return await this.provider.addToTranscript(by, message, from);
    }

    public getConversation = async (by: By, customerAddress?: builder.IAddress): Promise<Conversation> => {
        return await this.provider.getConversation(by, customerAddress);
    }

    public getCurrentConversations = async (): Promise<Conversation[]> => {
        return await this.provider.getCurrentConversations();
    }
};
