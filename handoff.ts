import * as builder from 'botbuilder';
import { Express } from 'express';
import { routeCustomerMessage } from './userMessage';
import { Conversation, conversations, ConversationState, TranscriptLine } from './globals';
import { getCustomerByName, getCustomerFromWaiting, sendAgentCommandOptions, passMessageToCustomer, disconnectFromCustomer, listCurrentConversations } from './agentLogic';

export const handoffMiddleware = (bot: builder.UniversalBot) => ({
    botbuilder: (session: builder.Session, next: Function) => {
        agentOrCustomer(session, bot, next);
    },
    send: (event: builder.IEvent, next: Function) => {
        captureMessagesFromBot(event, next);
    }
});


export const agentOrCustomer = (
    session: builder.Session,
    bot: builder.UniversalBot,
    next: Function
) => {
    console.log("conversations", conversations);

    const message = session.message;
    if (message.user.name.startsWith("Agent")) {
        routeAgentMessage(session, bot)
    } else {
        // located in userMessage.ts
        routeCustomerMessage(session, bot, next);
    }
};

export const routeAgentMessage = (
    session: builder.Session,
    bot: builder.UniversalBot,
) => {
    /* Do this for every agent message */
    console.log("message from agent");
    let conversation = conversations.find(conversation =>
        conversation.agent && conversation.agent.conversation.id === session.message.address.conversation.id
    );
    console.log('conversation for agent: ', conversation);
    const inputWords = session.message.text.split(' ');

    if (inputWords[0] === 'options') {
        sendAgentCommandOptions(session);
        return;
    }
    /* route message */

    if (!conversation) {
        if (inputWords[0] === 'connect') {
            if (inputWords.length > 1)
                getCustomerByName(session, bot, inputWords);
            else
                getCustomerFromWaiting(session, bot);
            return;
        } else if (inputWords[0] === 'list') {
            listCurrentConversations(session);

        } else {
            sendAgentCommandOptions(session);
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
        disconnectFromCustomer(session, bot, conversation);
        return;
    }

    passMessageToCustomer(session.message, bot, conversation);
    return;
};


export const addToTranscript = (transcript: TranscriptLine[], message: builder.IMessage) => {
    console.log("transcribing message", message);
    transcript.push({
        timestamp: message.timestamp,
        from: message.address,
        text: message.text
    });
};

export const captureMessagesFromBot = (event, next) => {
    // add bot msg to transcript
    let conversation = conversations.find(conversation =>
        conversation.customer.conversation.id === event.address.conversation.id
    );
    if (conversation && conversation.state !== ConversationState.Agent) {
        addToTranscript(conversation.transcript, event);

    }
    next();
};


export const addHandoffHooks = (app: Express) => {
    app.get('/handoff/conversations', (req, res) => {
        res.send(JSON.stringify(conversations));
    });

    app.get('/handoff/conversation/:conversationId', (req, res) => {
        let conversation = conversations.find(conversation =>
            conversation.customer.conversation.id && conversation.customer.conversation.id === req.params.conversationId);
        res.send(JSON.stringify(conversation.transcript));
    });
};
