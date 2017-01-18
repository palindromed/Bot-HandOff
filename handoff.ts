import * as builder from 'botbuilder';
import { Express } from 'express';
import { Conversation, conversations, ConversationState, TranscriptLine, Provider } from './globals';
import { defaultProvider } from './provider';

export class Handoff {
    constructor(private bot: builder.UniversalBot, private provider: Provider = defaultProvider) {
    }

    public routingMiddleware() {
        return {
            receive: (event: builder.IEvent, next: Function) => {
                if (event.type === 'message') {
                    this.routeMessage(event, next);
                }
            },
            send: (event: builder.IEvent, next: Function) => {
                this.captureMessagesFromBot(event, next);
            }
        }
    }

    public commandsMiddleware() {
        return {
            receive: (event: builder.IEvent, next: Function) => {
                if (event.type === 'message') {
                    this.command(event, next);
                }
            }
        }
    }

    public addHandoffHooks(app: Express) {
        app.get('/handoff/conversations', (req, res) => {
            res.send(JSON.stringify(conversations));
        });

        app.get('/handoff/conversation/:conversationId', (req, res) => {
            let conversation = conversations.find(conversation =>
                conversation.customer.conversation.id && conversation.customer.conversation.id === req.params.conversationId);
            res.send(JSON.stringify(conversation.transcript));
        });
    }

    private command(
        event: builder.IEvent,
        next: Function
    ) {
        const message = event as builder.IMessage;
        if (message.user.name.startsWith("Agent")) {
            this.agentCommand(message)
        } else {
            this.customerCommand(message, next);
        }
    }

    routeMessage(
        event: builder.IEvent,
        next: Function
    ) {
        const message = event as builder.IMessage;

        if (message.user.name.startsWith("Agent")) {
            this.routeAgentMessage(message)
        } else {
            // located in userMessage.ts
            this.routeCustomerMessage(message, next);
        }
    }

    private agentCommand(message: builder.IMessage) {
        const conversation = this.provider.findCurrentAgentConversation(message.address.conversation.id);

        const inputWords = message.text.split(' ');
        if (inputWords.length == 0)
            return;

        if (inputWords[0] === 'options') {
            this.sendAgentCommandOptions(message.address);
            return;
        }

        if (!conversation) {
            switch (inputWords[0]) {
                case 'connect':
                    if (inputWords.length > 1) {
                        this.getCustomerByName(message.address, inputWords);
                    } else {
                        this.connectToWaitingCustomerConversation(message.address);
                    }
                    break;
                case 'list':
                    const results = this.provider.listCurrentConversations();
                    if (!results) {
                        this.bot.send(new builder.Message().address(message.address).text("No customers are in conversation."));
                        break;
                    }
                    this.bot.send(new builder.Message().address(message.address).text(results));
                    break;
                default:
                    this.sendAgentCommandOptions(message.address);
                    break;
            }
            return;
        }

        if (conversation.state !== ConversationState.Agent) {
            // error state -- should not happen
            this.bot.send(new builder.Message().address(message.address).text("Shouldn't be in this state - agent should have been cleared out."));
            console.log("Shouldn't be in this state - agent should have been cleared out");
            return;
        }

        if (message.text === 'disconnect') {
            this.disconnectFromCustomer(conversation.customer.conversation.id);
            return;
        }
        this.passMessageToCustomer(message, conversation);
    }

    private routeAgentMessage(message: builder.IMessage) {
        const conversation = this.provider.findCurrentAgentConversation(message.address.conversation.id);

        if (!conversation)
            return;

        if (conversation.state !== ConversationState.Agent) {
            // error state -- should not happen
            this.bot.send(new builder.Message().address(message.address).text("Shouldn't be in this state - agent should have been cleared out."));
            console.log("Shouldn't be in this state - agent should have been cleared out");
            return;
        }
    }

    private customerCommand(message: builder.IMessage, next: Function) {
        if (message.text === 'help') {
            let conversation = this.provider.getCustomerConversationById(message.address.conversation.id);

            if (!conversation) {
                // first time caller, long time listener
                conversation = this.provider.createNewCustomerConversation(message.address);
            }

            if (conversation.state == ConversationState.Bot) {
                this.provider.addToTranscript(conversation.customer.conversation.id, message);
                this.provider.updateCustomerConversationState(conversation.customer.conversation.id, ConversationState.Waiting)
                this.bot.send(new builder.Message().address(message.address).text("Connecting you to the next available agent."));

                return;
            }
        }

        return next();
    }

    private routeCustomerMessage(message: builder.IMessage, next: Function) {
        let conversation = this.provider.getCustomerConversationById(message.address.conversation.id);

        if (!conversation) {
            // first time caller, long time listener
            conversation = this.provider.createNewCustomerConversation(message.address);

        }
        this.provider.addToTranscript(conversation.customer.conversation.id, message);

        switch (conversation.state) {
            case ConversationState.Bot:
                return next();
            case ConversationState.Waiting:
                this.bot.send(new builder.Message().address(message.address).text("Connecting you to the next available agent."));
                return;
            case ConversationState.Agent:
                if (!conversation.agent) {
                    this.bot.send(new builder.Message().address(message.address).text("No agent address present while customer in state Agent"));
                    console.log("No agent address present while customer in state Agent");
                    return;
                }
                this.bot.send(new builder.Message().address(conversation.agent).text(message.text));
                return;
        }
    }

    private captureMessagesFromBot(event, next) {
        let conversation = this.provider.getCustomerConversationById(event.address.conversation.id);

        if (conversation && conversation.state !== ConversationState.Agent) {
            this.provider.addToTranscript(conversation.customer.conversation.id, event);
        }
        next();
    }

    private passMessageToCustomer(message: builder.IMessage, conversation: Conversation) {
        this.provider.addToTranscript(conversation.customer.conversation.id, message);
        this.bot.send(new builder.Message().address(conversation.customer).text(message.text));
        return;
    };

    private connectToCustomer = (address: builder.IAddress, conversationId: string) => {
        this.provider.connectCustomerConversationToAgent(conversationId, address);
        return;
    };

    private disconnectFromCustomer = (conversationId: string) => {
        this.provider.disconnectAgentFromCustomerConversation(conversationId);
        return;
    };

    private connectToWaitingCustomerConversation = (agentAddress: builder.IAddress) => {
        const waitingConversation = this.provider.findCustomerConversationWaitingLongest();
        if (!waitingConversation) {
            this.bot.send(new builder.Message().address(agentAddress).text("No users waiting"));
            return;
        }

        this.connectToCustomer(agentAddress, waitingConversation.customer.conversation.id);
    }

    private getCustomerByName = (agentAddress: builder.IAddress, inputWords: string[]) => {
        const grabbedUser = this.provider.findCustomerConversationByName(inputWords);
        if (!grabbedUser) {
            this.bot.send(new builder.Message().address(agentAddress).text('There is no active customer named by that name'));
        } else {
            this.provider.connectCustomerConversationToAgent(grabbedUser.customer.conversation.id, agentAddress);
        }
    }

    private sendAgentCommandOptions = (agentAddress: builder.IAddress) => {
        const commands = ' ### Agent Options\n - Type *connect* to connect to customer who has been waiting longest.\n - Type *connect { user name }* to connect to a specific conversation\n - Type *list* to see a list of all current conversations.\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
        this.bot.send(new builder.Message().address(agentAddress).text(commands));
        return;
    }

};
