import * as builder from 'botbuilder';
import { Express } from 'express';
import { Conversation, By, ConversationState, TranscriptLine, Provider } from './globals';
import { defaultProvider } from './provider';

export class Handoff {
    constructor(private bot: builder.UniversalBot, private provider: Provider = defaultProvider) {
        this.provider.init();
    }

    public routingMiddleware() {
        return {
            botbuilder: (session: builder.Session, next: Function) => {
                if (session.message.type === 'message') {
                    this.routeMessage(session, next);
                }
            },
            send: (session: builder.Session, next: Function) => {
                this.trancribeMessageFromBot(session.message, next);
            }
        }
    }

    public addHandoffHooks(app: Express) {
        app.get('/handoff/conversations', (req, res) => {
            res.send(JSON.stringify(this.provider.currentConversations()));
        });

        app.get('/handoff/conversations/:conversationId', (req, res) => {
            let conversation = this.provider.getConversation({ customerConversationId: req.params.conversationId });
            res.send(JSON.stringify(conversation.transcript));
        });
    }

    private routeMessage(
        session: builder.Session,
        next: Function
    ) {
        if (session.message.user.name.startsWith("Agent")) {
            console.log("agent");
            this.routeAgentMessage(session)
        } else {
            console.log("customer");
            this.routeCustomerMessage(session, next);
        }
    }

    private routeAgentMessage(session: builder.Session) {
        const message = session.message;
        const conversation = this.provider.getConversation({ agentConversationId: message.address.conversation.id });

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
        let conversation = this.provider.getConversation({ customerConversationId: message.address.conversation.id });

        if (!conversation) {
            conversation = this.provider.createConversation(message.address);
        }
        this.provider.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, message.text);

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

    public createConversation = (customerAddress: builder.IAddress) =>
        this.provider.createConversation(customerAddress);

    public connectCustomerToAgent = (by: By, agentAddress: builder.IAddress) =>
        this.provider.connectCustomerToAgent(by, agentAddress);

    public connectCustomerToBot = (by: By) =>
        this.provider.connectCustomerToBot(by);

    public queueCustomerForAgent = (by: By) =>
        this.provider.queueCustomerForAgent(by);

    public addToTranscript = (by: By, text: string) =>
        this.provider.addToTranscript(by, text);

    public getConversation = (by: By) =>
        this.provider.getConversation(by);
    
    public currentConversations = () =>
        this.provider.currentConversations();

};
