import * as builder from 'botbuilder';
import { Express } from 'express';
import { Conversation, conversations, ConversationState, TranscriptLine, Provider } from './globals';
import { getCustomerByName, getCustomerFromWaiting, sendAgentCommandOptions, passMessageToCustomer, disconnectFromCustomer, listCurrentConversations } from './agentLogic';
import { defaultProvider, getCustomerById } from './provider';

export class Handoff {
    constructor(private bot: builder.UniversalBot, private provider: Provider = defaultProvider) {
    }

    public routingMiddleware() {
        return {
            botbuilder: (session: builder.Session, next: Function) => {
                this.routeMessage(session, next);
            },
            send: (event: builder.IEvent, next: Function) => {
                this.captureMessagesFromBot(event, next);
            }
        }
    }

    public commandsMiddleware() {
        return {
            botbuilder: (session: builder.Session, next: Function) => {
                this.command(session, next);
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
        session: builder.Session,
        next: Function
    ) {
        console.log("conversations", conversations);

        const message = session.message;
        if (message.user.name.startsWith("Agent")) {
            this.agentCommand(session)
        } else {
            // located in userMessage.ts
            this.customerCommand(session, next);
        }
    }

    routeMessage(
        session: builder.Session,
        next: Function
    ) {
        console.log("conversations", conversations);

        const message = session.message;
        if (message.user.name.startsWith("Agent")) {
            this.routeAgentMessage(session)
        } else {
            // located in userMessage.ts
            this.routeCustomerMessage(session, next);
        }
    }

    private agentCommand(session: builder.Session) {
        /* Do this for every agent message */
        console.log("message from agent", session.message.text);
        const conversation = conversations.find(conversation =>
            conversation.agent && conversation.agent.conversation.id === session.message.address.conversation.id
        );
        console.log('conversation for agent: ', conversation);

        const inputWords = session.message.text.split(' ');
        if (inputWords.length == 0)
            return;

        if (inputWords[0] === 'options') {
            sendAgentCommandOptions(session);
            return;
        }

        if (!conversation) {
            switch (inputWords[0]) {
                case 'connect':
                    if (inputWords.length > 1) {
                        getCustomerByName(session, inputWords);
                    } else {
                        getCustomerFromWaiting(session);
                    }
                    break;
                case 'list':
                    listCurrentConversations(session);
                    break;
                default:
                    sendAgentCommandOptions(session);
                    break;
            }
            return;
        }

        if (conversation.state !== ConversationState.Agent) {
            // error state -- should not happen
            session.send("Shouldn't be in this state - agent should have been cleared out.");
            console.log("Shouldn't be in this state - agent should have been cleared out");
            return;
        }

        if (session.message.text === 'disconnect') {
            disconnectFromCustomer(session, conversation);
            return;
        }
    }

    private routeAgentMessage(session: builder.Session) {
        /* Do this for every agent message */
        console.log("message from agent");
        const conversation = conversations.find(conversation =>
            conversation.agent && conversation.agent.conversation.id === session.message.address.conversation.id
        );
        console.log('conversation for agent: ', conversation);

        if (!conversation)
            return;

        if (conversation.state !== ConversationState.Agent) {
            // error state -- should not happen
            session.send("Shouldn't be in this state - agent should have been cleared out.");
            console.log("Shouldn't be in this state - agent should have been cleared out");
            return;
        }

        passMessageToCustomer(session.message, conversation);
    }


    private customerCommand(session: builder.Session, next: Function) {
        if (session.message.text === 'help') {
            console.log("customer wants to talk to agent");
            let conversation = conversations.find(conversation =>
                conversation.customer.conversation.id === session.message.address.conversation.id
            );

            if (!conversation) {
                // first time caller, long time listener
                conversation = {
                    customer: session.message.address,
                    state: ConversationState.Bot,
                    transcript: []
                };
                conversations.push(conversation);
            }

            if (conversation.state == ConversationState.Bot) {
                this.provider.addToTranscript(conversation.customer.conversation.id, session.message);
                console.log("switching to Waiting");
                conversation.state = ConversationState.Waiting;
                session.send("Connecting you to the next available agent.");
                return;
            }
        }

        console.log("not a valid command, pass on to next stage");
        return next();
    }

    private routeCustomerMessage(session: builder.Session, next: Function) {
        console.log("message from customer");
        let conversation = conversations.find(conversation =>
            conversation.customer.conversation.id === session.message.address.conversation.id
        );

        if (!conversation) {
            // first time caller, long time listener
            conversation = {
                customer: session.message.address,
                state: ConversationState.Bot,
                transcript: []
            };
            conversations.push(conversation);
        }
        this.provider.addToTranscript(conversation.customer.conversation.id, session.message);

        switch (conversation.state) {
            case ConversationState.Bot:
                console.log("passing message to bot");
                return next();
            case ConversationState.Waiting:
                console.log("ignore message while waiting");
                session.send("Connecting you to the next available agent.");
                return;
            case ConversationState.Agent:
                if (!conversation.agent) {
                    session.send("No agent address present while customer in state Agent");
                    console.log("No agent address present while customer in state Agent");
                    return;
                }
                console.log("passing message to agent");
                this.bot.send(new builder.Message().address(conversation.agent).text(session.message.text));
                return;
        }

    }
    private captureMessagesFromBot(event, next) {
        // add bot msg to transcript
        let conversation = conversations.find(conversation =>
            conversation.customer.conversation.id === event.address.conversation.id
        );
        if (conversation && conversation.state !== ConversationState.Agent) {
            this.provider.addToTranscript(conversation.customer.conversation.id, event);

        }
        next();
    }


    private passMessageToCustomer(message: builder.IMessage, conversation: Conversation) {
        console.log("passing agent message to user");
        this.provider.addToTranscript(conversation.customer.conversation.id, message);
        this.bot.send(new builder.Message().address(conversation.customer).text(message.text));
        return;
    };

    private sendTranscript = (session: builder.Session, conversation: Conversation) => {
        // add call to provider to get transcript?
        session.send('Here is the customer transcript:');
        conversation.transcript.forEach(transcriptLine => {
            console.log(transcriptLine.text);
            session.send(transcriptLine.text);
        });
    };

    private connectToCustomer = (session: builder.Session, conversationId: string) => {
        sendTranscript(session, conversationId);
        this.provider.connectCustomerToAgent(conversationId, session.message.address);
        // get conversation to be able to send msgs to show connection
        const conversation = getCustomerById(conversationId);
        session.send("You are now talking to " + conversation.customer.user.name);
        this.bot.send(new builder.Message().address(conversation.customer).text("You are now talking to agent " + session.message.address.user.name));
        return;
    };

    private disconnectFromCustomer = (session: builder.Session, bot: builder.UniversalBot, conversation: Conversation) => {
        console.log('disconnecting from user');
        conversation.state = ConversationState.Bot;
        delete conversation.agent;
        session.send("Disconnected from " + conversation.customer.user.name);
        bot.send(new builder.Message().address(conversation.customer).text("You are now talking to the bot."));
        return;
    };

    private getCustomerFromWaiting = (session: builder.Session, bot: builder.UniversalBot) => {
        // query for who is waiting/longest
        this.provider.

       
            connectToCustomer(session, bot, waitingConversation);
            return;
        }
    };

    private getCustomerByName = (session: builder.Session, inputWords: string[]) => {
        let customerNameInArray = inputWords.slice(1);
        let customerName = customerNameInArray.join(' ');
        let grabbedUser = conversations.find(conversation =>
            conversation.customer.user.name === customerName
        );
        if (!grabbedUser)
            session.send('There is no active customer named *' + customerName + '*.');
        else
            this.provider.connectCustomerToAgent(grabbedUser.customer.conversation.id, session.message.address);
    };

    private sendAgentCommandOptions = (session: builder.Session) => {
        const commands = ' ### Agent Options\n - Type *connect* to connect to customer who has been waiting longest.\n - Type *connect { user name }* to connect to a specific conversation\n - Type *list* to see a list of all current conversations.\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
        session.send(commands);
        return;
    };

};

