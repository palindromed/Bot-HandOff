import * as builder from 'botbuilder';
import Conversation from './Conversation';
import TranscriptLine from './TranscriptLine';
import By from './By';

interface Provider {
    init();

    // Update
    addToTranscript: (by: By, text: string) => boolean;
    connectCustomerToAgent: (by: By, agentAddress: builder.IAddress) => Conversation;
    connectCustomerToBot: (by: By) => boolean;
    queueCustomerForAgent: (by: By) => boolean;
    
    // Get
    getConversation: (by: By, customerAddress?: builder.IAddress) => Conversation;
    currentConversations: () => Conversation[];
}

export default Provider;
