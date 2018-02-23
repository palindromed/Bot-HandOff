import { Bot, ConversationReference, Activity, Middleware, ResourceResponse } from 'botbuilder';
import { defaultProvider } from './provider';
import { NextFunc } from './util';

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
    customer: ConversationReference,
    agent?: ConversationReference,
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
    init(): void;

    // Update
    addToTranscript: (by: By, text: string) => boolean;
    connectCustomerToAgent: (by: By, nextState: ConversationState, agentAddress: ConversationReference) => Conversation;
    connectCustomerToBot: (by: By) => boolean;
    queueCustomerForAgent: (by: By) => boolean;

    // Get
    getConversation: (by: By, customerAddress?: ConversationReference) => Conversation;
    currentConversations: () => Conversation[];
}

export class Handoff {
    // if customizing, pass in your own check for isAgent and your own versions of methods in defaultProvider
    constructor(
        private bot: Bot,
        public isAgent: (context: BotContext) => boolean,
        private provider = defaultProvider
    ) {
        this.provider.init();
    }

    public routingMiddleware(): Middleware {
        return {
            receiveActivity: (context: BotContext, next: NextFunc<void>): Promise<void> => {
                // Pass incoming messages to routing method
                if (context.request.type === 'message') {
                    return this.routeMessage(context, next);
                }
                return next();
            },
            postActivity: (context: BotContext, activities: Activity[], next: NextFunc<ResourceResponse[]>): any => {
                // Messages sent from the bot do not need to be routed                
                activities.forEach((activity) => {
                    const customerConversation = this.getConversation({ customerConversationId: activity.conversation.id });
                    if (customerConversation) {
                        // send message to agent observing conversation
                        if (customerConversation.state === ConversationState.Watch) {
                            this.sendToConversation(customerConversation.agent, activity.text)
                        }
                        this.trancribeMessageFromBot(activity);
                    }
                });
                return next();
            }
        }
    }

    private routeMessage(
        context: BotContext,
        next: Function
    ): Promise<void> {
        if (this.isAgent(context)) {
            return this.routeAgentMessage(context);
        } else {
            return this.routeCustomerMessage(context, next);
        }
    }

    private routeAgentMessage(context: BotContext): Promise<void> {
        const request = context.request;
        const conversation = this.getConversation({ agentConversationId: request.conversation.id });

        // if the agent is not in conversation, no further routing is necessary
        if (!conversation)
            return Promise.resolve();
        // if the agent is observing a customer, no need to route message
        if (conversation.state !== ConversationState.Agent)
            return Promise.resolve();
        // send text that agent typed to the customer they are in conversation with
        this.sendToConversation(conversation.customer, request.text);
        return Promise.resolve();
    }

    private routeCustomerMessage(context: BotContext, next: Function): Promise<void> {
        const request = context.request;
        // method will either return existing conversation or a newly created conversation if this is first time we've heard from customer
        const conversation = this.getConversation({ customerConversationId: request.conversation.id }, context.conversationReference as ConversationReference);
        this.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, request.text);

        switch (conversation.state) {
            case ConversationState.Bot:
                return next();
            case ConversationState.Waiting:
                context.reply("Connecting you to the next available agent.");
                return Promise.resolve();
            case ConversationState.Watch:
                this.sendToConversation(conversation.agent, request.text)
                return next();
            case ConversationState.Agent:
                if (!conversation.agent) {
                    context.reply("No agent address present while customer in state Agent");
                    console.log("No agent address present while customer in state Agent");
                    return Promise.resolve();
                }
                this.sendToConversation(conversation.agent, request.text);
                return Promise.resolve();
        }
        return Promise.resolve();
    }

    // These methods are wrappers around provider which handles data
    private trancribeMessageFromBot(message: Activity) {
        this.provider.addToTranscript({ customerConversationId: message.conversation.id }, message.text);
    }

    private sendToConversation = (conversationReference: ConversationReference, text: string) =>
        this.bot.createContext(conversationReference, (context) => { context.reply(text) });


    public getCustomerTranscript(by: By, context: BotContext) {
        const customerConversation = this.getConversation(by);
        if (customerConversation) {
            customerConversation.transcript.forEach(transcriptLine =>
                context.reply(transcriptLine.text));
        } else {
            context.reply('No Transcript to show. Try entering a username or try again when connected to a customer');
        }
    }

    public connectCustomerToAgent = (by: By, nextState: ConversationState, agentAddress: ConversationReference) =>
        this.provider.connectCustomerToAgent(by, nextState, agentAddress);

    public connectCustomerToBot = (by: By) =>
        this.provider.connectCustomerToBot(by);

    public queueCustomerForAgent = (by: By) =>
        this.provider.queueCustomerForAgent(by);

    public addToTranscript = (by: By, text: string) =>
        this.provider.addToTranscript(by, text);

    public getConversation = (by: By, customerAddress?: ConversationReference) =>
        this.provider.getConversation(by, customerAddress);

    public currentConversations = () =>
        this.provider.currentConversations();


};
