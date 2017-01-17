import * as builder from 'botbuilder';
import { Conversation, conversations, ConversationState, TranscriptLine } from './globals';
import { addToTranscript } from './handoff';

export const passMessageToCustomer = (message: builder.IMessage, bot: builder.UniversalBot, conversation: Conversation) => {
    console.log("passing agent message to user");
    addToTranscript(conversation.transcript, message);
    bot.send(new builder.Message().address(conversation.customer).text(message.text));
    return;
};

export const sendTranscript = (session: builder.Session, conversation: Conversation) => {
    session.send('Here is the customer transcript:');
    conversation.transcript.forEach(transcriptLine => {
        console.log(transcriptLine.text);
        session.send(transcriptLine.text);
    });
};

export const connectToCustomer = (session: builder.Session, bot: builder.UniversalBot, conversation: Conversation) => {
    sendTranscript(session, conversation);
    conversation.state = ConversationState.Agent;
    conversation.agent = session.message.address;
    session.send("You are now talking to " + conversation.customer.user.name);
    bot.send(new builder.Message().address(conversation.customer).text("You are now talking to agent " + session.message.address.user.name));
    return;
};

export const disconnectFromCustomer = (session: builder.Session, bot: builder.UniversalBot, conversation: Conversation) => {
    console.log('disconnecting from user');
    conversation.state = ConversationState.Bot;
    delete conversation.agent;
    session.send("Disconnected from " + conversation.customer.user.name);    
    bot.send(new builder.Message().address(conversation.customer).text("You are now talking to the bot."));
    return;
};

export const getCustomerFromWaiting = (session: builder.Session, bot: builder.UniversalBot) => {
    let waitingConversations = conversations.filter((x) => x.state === ConversationState.Waiting);
    console.log('customers in Waiting state: ', waitingConversations);
    if (waitingConversations.length === 0) {
        session.send("No users waiting");
        return;
    } else {
        // TODO change to a non mutating method
        waitingConversations.sort((x, y) => Date.parse(y.transcript[y.transcript.length - 1].timestamp) - Date.parse(x.transcript[x.transcript.length - 1].timestamp))
        const waitingConversation = waitingConversations[0];
        connectToCustomer(session, bot, waitingConversation);
        return;
    }
};

export const getCustomerByName = (session: builder.Session, bot: builder.UniversalBot, inputWords: string[]) => {
    let customerNameInArray = inputWords.slice(1);
    let customerName  = customerNameInArray.join(' ');
    let grabbedUser = conversations.find(conversation =>
        conversation.customer.user.name === customerName
    );
    if (!grabbedUser)
        session.send('There is no active customer named *' + customerName + '*.');
    else
        connectToCustomer(session, bot, grabbedUser);
};

export const sendAgentCommandOptions = (session: builder.Session) => {
    const commands = ' ### Agent Options\n - Type *connect* to connect to customer who has been waiting longest.\n - Type *connect { user name }* to connect to a specific conversation\n - Type *list* to see a list of all current conversations.\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
    session.send(commands);
    return;
};

export const listCurrentConversations = (session: builder.Session) => {
    if (conversations.length === 0) {
        session.send("No customers are in conversation.");
        return;
    }

    let text = '### Current Conversations \n';
    conversations.forEach(conversation => {
        const starterText = ' - *' + conversation.customer.user.name + '*';
        switch (ConversationState[conversation.state]) {
            case 'Bot':
                text += starterText + ' is talking to the bot\n';
                break;
            case 'Agent':
                text += starterText + ' is talking to an agent\n';
                break;
            case 'Waiting':
                text += starterText + ' is waiting to talk to an agent\n';
                break;
        }
    });

    session.send(text);
}