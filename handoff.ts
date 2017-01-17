import * as builder from 'botbuilder';
import { Express } from 'express';
import { Conversation, conversations, ConversationState, TranscriptLine } from './globals';
import { getCustomerByName, getCustomerFromWaiting, sendAgentCommandOptions, passMessageToCustomer, disconnectFromCustomer, listCurrentConversations } from './agentLogic';

export const routingMiddleware = (bot: builder.UniversalBot) => ({
    botbuilder: (session: builder.Session, next: Function) => {
        routeMessage(session, bot, next);
    },
    send: (event: builder.IEvent, next: Function) => {
        captureMessagesFromBot(event, next);
    }
});

export const commandsMiddleware = (bot: builder.UniversalBot) => ({
    botbuilder: (session: builder.Session, next: Function) => {
        command(session, bot, next);
    }
});

export const command = (
    session: builder.Session,
    bot: builder.UniversalBot,
    next: Function
) => {
    console.log("conversations", conversations);

    const message = session.message;
    if (message.user.name.startsWith("Agent")) {
        agentCommand(session, bot)
    } else {
        // located in userMessage.ts
        customerCommand(session, bot, next);
    }    
}

export const routeMessage = (
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
}

export const agentCommand = (
    session: builder.Session,
    bot: builder.UniversalBot,
) => {
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
                    getCustomerByName(session, bot, inputWords);
                } else {
                    getCustomerFromWaiting(session, bot);
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
        disconnectFromCustomer(session, bot, conversation);
        return;
    }
}

export const routeAgentMessage = (
    session: builder.Session,
    bot: builder.UniversalBot,
) => {
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

    passMessageToCustomer(session.message, bot, conversation);
}


export const customerCommand = (
    session: builder.Session,
    bot: builder.UniversalBot,
    next: Function
) => {
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
            addToTranscript(conversation.transcript, session.message);
            console.log("switching to Waiting");
            conversation.state = ConversationState.Waiting;
            session.send("Connecting you to the next available agent.");
            return;
        }
    }

    console.log("not a valid command, pass on to next stage");
    return next();
}

export const routeCustomerMessage = (
    session: builder.Session,
    bot: builder.UniversalBot,
    next: Function
) => {
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
    addToTranscript(conversation.transcript, session.message);

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
            bot.send(new builder.Message().address(conversation.agent).text(session.message.text));
            return;
    }

}

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
