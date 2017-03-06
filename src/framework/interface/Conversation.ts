import * as builder from 'botbuilder';
import ConversationState from '../enum/ConversationState';
import TranscriptLine from './TranscriptLine';

// What is stored in a conversation. Agent only included if customer is talking to an agent
interface Conversation {
    customer: builder.IAddress,
    agent?: builder.IAddress,
    state: ConversationState,
    transcript: TranscriptLine[]
};

export default Conversation;
