import * as builder from 'botbuilder';
import { Conversation, conversations, ConversationState, TranscriptLine } from './globals';
import { addToTranscript } from './handoff';

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
            if (session.message.text === 'help') {
                console.log("switching to Waiting");
                conversation.state = ConversationState.Waiting;
                session.send("Connecting you to the next available agent.");
                return;
            }
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

};