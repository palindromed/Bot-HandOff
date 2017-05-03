import * as builder from 'botbuilder';
import { By, Conversation, ConversationState, Handoff } from './handoff';

/**
 * Specific pre-built suggestion cards that need to be sent to the agent for response.
 * Additionally, these cards will be queued up in case we don't yet have an agent connected.
 * TODO
 * @param bot
 * @param session 
 * @param suggestion The card or suggested response for the agent to approve/deny
 */
export function askAgent(bot: builder.UniversalBot, session: builder.Session, handoff: Handoff) {
    return new Promise((resolve, reject) => {
        const conversation: Conversation = handoff.getConversation(
            { customerConversationId: session.message.address.conversation.id },
            session.message.address);
        if (conversation.state === ConversationState.Bot) {
            handoff.changeStateToResolve({ customerConversationId: conversation.customerConversationId });
        }
        const messageIndex: number = conversation.transcript.findIndex(x => x.text === session.message.text)
        const msgToAgent: builder.Message = buildSuggestions(session, messageIndex)

        if (conversation.agent) {
            handoff.await(session.message.address.conversation.id, resolve, reject);
            bot.send(msgToAgent.address(conversation.agent));

        } else {
            handoff.await(session.message.address.conversation.id, resolve, reject, msgToAgent);
        }
    });
}

function buildSuggestions(session: builder.Session, messageIndex: number) {

    let cards: builder.HeroCard[] = [];
    const answerCard: builder.HeroCard = new builder.HeroCard()
        .title('Possible Answer')
        .subtitle('customer input: ' + session.message.text)
        .text('here is the first possible answer')
        .buttons([
            builder.CardAction.postBack(null, 'here is the first possible answer ' + messageIndex, 'Correct')
        ]);
    const answerCard2: builder.HeroCard = new builder.HeroCard()
        .title('Possible Answer')
        .subtitle('customer input: ' + session.message.text)
        .text('here is the second possible answer')
        .buttons([
            builder.CardAction.postBack(null, 'here is the second possible answer ' + messageIndex, 'Correct')
        ]);


    const noOptions: builder.HeroCard = new builder.HeroCard()
        .title('Answer Not Present')
        .subtitle('customer input: ' + session.message.text)
        .text('Correct answer not suggested. Type in a custom answer')
        .buttons([
            builder.CardAction.postBack(null, 'manual ' + messageIndex, 'Free Type')
        ]);
    const passOnMsg: builder.HeroCard = new builder.HeroCard()
        .title('No answer needed')
        .subtitle('customer input: ' + session.message.text)
        .text('No need to respond to customer. Resolve without returning a message')
        .buttons([
            builder.CardAction.postBack(null, 'pass ' + messageIndex, 'No Response')
        ]);
    cards.push(answerCard, answerCard2, noOptions, passOnMsg);
    return new builder.Message()
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
}
