import { setTimeout } from 'timers';
import { IUniversalBotSettings } from 'botbuilder/lib';
import { handleCustomerMessage } from './userMessage';
import * as builder from 'botbuilder';
import { Conversation, conversations, ConversationState, TranscriptLine } from './globals';
import { handleAgentMessage } from './agentLogic';
import { Express } from 'express';

export const addToTranscript = (transcript: TranscriptLine[], message: builder.IMessage) => {
    console.log("transcribing message", message);
    transcript.push({
        timestamp: message.timestamp,
        from: message.address,
        text: message.text
    });
};


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
                handleAgentMessage(message, bot)
            } else {
                handleCustomerMessage(message, bot, next);
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
