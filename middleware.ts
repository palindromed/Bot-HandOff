import * as builder from 'botbuilder';
import { conversations, ConversationState, TranscriptLine } from './globals';


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
                // If we're hearing from an agent they are already part of a conversation
                const conversation = conversations.find(conversation =>
                    conversation.agent.conversation.id === message.address.conversation.id
                );

                if (typeof conversation === 'undefined') {
                    console.log('not in conversation yet')
                    // find which users have status of waiting
                    // find which user has been waiting longest
                    let waitingUsers = conversations.filter((x) => x.state === ConversationState.Waiting)
                    if (waitingUsers.length === 0) {
                        bot.send(new builder.Message().address(message.address).text("You are no longer in conversation with the user. No users waiting"));
                        // connect this agent to that user
                        return;
                    }
                    console.log('*****************************');
                    console.log(waitingUsers);
                    console.log(waitingUsers[0]);
                    waitingUsers[0].state = ConversationState.Agent;
                    waitingUsers[0].agent = message.address;

                    return;
                }

                if (conversation.state !== ConversationState.Agent) {
                    bot.send(new builder.Message().address(message.address).text("Shouldn't be in this state - agent should have been cleared out."));
                    console.log("Shouldn't be in this state - agent should have been cleared out");
                    return;
                }

                console.log("passing agent message to user");
                addToTranscript(conversation.transcript, message);
                bot.send(new builder.Message().address(conversation.customer).text(message.text));
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
                            return;
                        }
                        console.log("pasing message to bot");
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
        case 'conversationUpdate':
            console.log('user: ' + event.user);
    }
}