import * as builder from 'botbuilder';
import { Conversation, conversations, ConversationState, TranscriptLine } from './globals';
import { addToTranscript } from './middleware';
import { Express } from 'express'

export const handleCustomerMessage = (
    message: builder.IMessage,
    bot: builder.UniversalBot,
    next: Function
) => {
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