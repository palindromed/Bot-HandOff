import * as builder from 'botbuilder';
import { Conversation, conversations, ConversationState, TranscriptLine } from './globals';
import { Express } from 'express';

const addToTranscript = (transcript: TranscriptLine[], message: builder.IMessage) => {
    console.log("transcribing message", message);
    transcript.push({
        timestamp: message.timestamp,
        from: message.address,
        text: message.text
    });
}

export const route = (
    event: builder.IEvent,
    bot: builder.UniversalBot,
    next: Function
) => {
    console.log("middleware event", event);
    console.log("conversations", conversations);

    switch (event.type) {
        case 'message':
            const message = event as builder.IMessage;
            if (message.user.name.startsWith("Agent")) {
                console.log("message from agent");

                let conversation = conversations.find(conversation =>
                    conversation.agent && conversation.agent.conversation.id === message.address.conversation.id
                );
                console.log('conversation for agent: ', conversation);

                if (!conversation) {
                    const inputWords = message.text.split(' ');
                    if (inputWords[0] === 'connect') {
                        // agent api for dealing with queue of users who initiated talk to agent state
                        // replace with button in agent ui
                        let waitingConversations = conversations.filter((x) => x.state === ConversationState.Waiting);
                        console.log('customers in Waiting state: ', waitingConversations);

                        if (waitingConversations.length === 0) {
                            bot.send(new builder.Message().address(message.address).text("You are no longer in conversation with the user. No users waiting"));
                            return;
                        } else {
                            waitingConversations.sort((x, y) => Date.parse(y.transcript[y.transcript.length - 1].timestamp) - Date.parse(x.transcript[x.transcript.length - 1].timestamp))
                            // connect this agent to the customer that has been waiting the longest
                            const waitingConversation =  waitingConversations[0];
                            waitingConversation.state = ConversationState.Agent;
                            waitingConversation.agent = message.address;
                            bot.send(new builder.Message().address(message.address).text("You are now talking to " + waitingConversation.customer.user.name));
                            return;
                        }
                    } else if (inputWords[0] === 'grab') {
                        let waitingConversation = conversations.find(conversation =>
                            conversation.customer.conversation.id === inputWords[1]
                        );
                        waitingConversation.state = ConversationState.Agent;
                        waitingConversation.agent = message.address;
                        bot.send(new builder.Message().address(message.address).text("You are now talking to " + waitingConversation.customer.user.name));
                        bot.send(new builder.Message().address(waitingConversation.customer).text("You are now talking to agent " + waitingConversation.agent.user.name));                  
                    } else {
                        bot.send(new builder.Message().address(message.address).text("You are no longer in conversation and did not try connecting to a customer"));
                        return;
                    }
                }

                if (conversation.state !== ConversationState.Agent) {
                    bot.send(new builder.Message().address(message.address).text("Shouldn't be in this state - agent should have been cleared out."));
                    console.log("Shouldn't be in this state - agent should have been cleared out");
                    return;
                }
                if (message.text === 'disconnect') {
                    // change this to a button when agent ui exists
                    console.log('disconnecting from user');
                    conversation.state = ConversationState.Bot;
                    delete conversation.agent;
                    bot.send(new builder.Message().address(conversation.customer).text("You are now talking to the bot."));
                    bot.send(new builder.Message().address(message.address).text("Disconnected from user."));
                    return;
                }

                console.log("passing agent message to user");
                addToTranscript(conversation.transcript, message);
                bot.send(new builder.Message().address(conversation.customer).text(message.text));
                return;
            } else {
                console.log("message from customer");
                let conversation = conversations.find(conversation =>
                    conversation.customer.conversation.id === message.address.conversation.id
                );

                if (!conversation) {
                    // first time caller, long time listener
                    conversation = {
                        customer: message.address,
                        state: ConversationState.Bot,
                        transcript: []
                    };
                    conversations.push(conversation);
                }
                addToTranscript(conversation.transcript, message);

                switch (conversation.state) {
                    case ConversationState.Bot:
                        if (message.text === 'help') {
                            console.log("switching to Waiting");
                            conversation.state = ConversationState.Waiting;
                            bot.send(new builder.Message().address(message.address).text("Connecting you to the next available agent."));
                            return;
                        }
                        console.log("passing message to bot");
                        return next();
                    case ConversationState.Waiting:
                        console.log("ignore message while waiting");
                        bot.send(new builder.Message().address(message.address).text("Connecting you to the next available agent."));
                        return;
                    case ConversationState.Agent:
                        if (!conversation.agent) {
                            bot.send(new builder.Message().address(message.address).text("No agent address present while customer in state Agent"));
                            console.log("No agent address present while customer in state Agent");
                            return;
                        }
                        console.log("passing message to agent");
                        bot.send(new builder.Message().address(conversation.agent).text(message.text));
                        return;
                }

            }
    }
}

export const captureMessagesFromBot = (event, next) => {
    // add bot msg to transcript
    let conversation = conversations.find(conversation =>
        conversation.customer.conversation.id === event.address.conversation.id
    );
    if (conversation && conversation.state !== ConversationState.Agent) {
        addToTranscript(conversation.transcript, event);

    }
    next();
}

export const addHandoffHooks = (app: Express) => {
    app.get('/handoff/conversations', (req, res) => {
        res.send(JSON.stringify(conversations));
    });

    app.get('/handoff/conversation/:conversationId', (req, res) => {
        let conversation = conversations.find(conversation =>
            conversation.customer.conversation.id && conversation.customer.conversation.id === req.params.conversationId);
        res.send(JSON.stringify(conversation.transcript));
    });
}
