import { BotConnectorBot } from 'botbuilder/lib';
import * as builder from 'botbuilder';
import { Conversation, conversations, ConversationState, TranscriptLine } from './globals';
import { addToTranscript } from './middleware';
import { Express } from 'express';

const passMessageToCustomer = (message: builder.IMessage, bot: builder.UniversalBot, conversation: Conversation) => {
    console.log("passing agent message to user");
    addToTranscript(conversation.transcript, message);
    bot.send(new builder.Message().address(conversation.customer).text(message.text));
    return;
}

const sendTranscript = (bot: builder.UniversalBot, conversation: Conversation, agent: builder.IAddress) => {
    conversation.transcript.forEach(transcriptLine => {
        console.log(transcriptLine.text);
        bot.send(new builder.Message().address(agent).text(transcriptLine.text));
    });
}

const connectToCustomer = (bot: builder.UniversalBot, conversation: Conversation, agent: builder.IAddress) => {
    // sendTranscript(bot, conversation, agent);
    conversation.state = ConversationState.Agent;
    conversation.agent = agent;
    bot.send(new builder.Message().address(agent).text("You are now talking to " + conversation.customer.user.name));
    bot.send(new builder.Message().address(conversation.customer).text("You are now talking to agent " + agent.user.name));
    return;
}

const disconnectFromCustomer = (message: builder.IMessage, bot: builder.UniversalBot, conversation: Conversation) => {
    console.log('disconnecting from user');
    conversation.state = ConversationState.Bot;
    delete conversation.agent;
    bot.send(new builder.Message().address(conversation.customer).text("You are now talking to the bot."));
    bot.send(new builder.Message().address(message.address).text("Disconnected from " + conversation.customer.user.name));
    return;
}

const getCustomerFromWaiting = (message: builder.IMessage, bot: builder.UniversalBot) => {
    let waitingConversations = conversations.filter((x) => x.state === ConversationState.Waiting);
    console.log('customers in Waiting state: ', waitingConversations);
    if (waitingConversations.length === 0) {
        bot.send(new builder.Message().address(message.address).text("No users waiting"));
        return;
    } else {
        // TODO change to a non mutating method
        waitingConversations.sort((x, y) => Date.parse(y.transcript[y.transcript.length - 1].timestamp) - Date.parse(x.transcript[x.transcript.length - 1].timestamp))
        const waitingConversation = waitingConversations[0];
        connectToCustomer(bot, waitingConversation, message.address);
        return;
    }
}

const getCustomerById = (message: builder.IMessage, bot: builder.UniversalBot, inputWords: string[]) => {

    let waitingConversation = conversations.find(conversation =>
        conversation.customer.conversation.id === inputWords[1]
    );
    connectToCustomer(bot, waitingConversation, message.address);
    return;
}

const getCustomerByName = (message: builder.IMessage, bot: builder.UniversalBot, inputWords: string[]) => {
    let customerNameInArray = inputWords.slice(1);
    let customerName  = customerNameInArray.join(' ');
    let grabbedUser = conversations.find(conversation =>
        conversation.customer.user.name === customerName
    );
    connectToCustomer(bot, grabbedUser, message.address);
    return;
}

const sendAgentCommandOptions = (message: builder.IMessage, bot: builder.UniversalBot) => {
    const commands = ' ### Agent Options\n - Type *connect* to connect to customer who has been waiting longest.\n - Type *list* to see a list of all current conversations.\n - Type *grab { user name }* to connect to a specific conversation\n - Type *disconnect* while talking to a user to end a conversation.\n - Type *options* at any time to see these options again.';
    bot.send(new builder.Message().address(message.address).text(commands).textFormat('markdown'));
    return;
};

export const handleAgentMessage = (
    message: builder.IMessage,
    bot: builder.UniversalBot,
) => {
    /* Do this for every agent message */
    console.log("message from agent");
    let conversation = conversations.find(conversation =>
        conversation.agent && conversation.agent.conversation.id === message.address.conversation.id
    );
    console.log('conversation for agent: ', conversation);
    const inputWords = message.text.split(' ');

    if (inputWords[0] === 'options') {
        sendAgentCommandOptions(message, bot)
        return;
    }
    /* route message */

    if (!conversation) {
        notInConversation(message, bot, inputWords);
        return;
    }
    if (conversation.state !== ConversationState.Agent) {
        // error state -- should not happen
        bot.send(new builder.Message().address(message.address).text("Shouldn't be in this state - agent should have been cleared out."));
        console.log("Shouldn't be in this state - agent should have been cleared out");
        return;
    }
    if (message.text === 'disconnect') {
        disconnectFromCustomer(message, bot, conversation);
        return;
    }

    passMessageToCustomer(message, bot, conversation);
    return;

}

const notInConversation = (message: builder.IMessage, bot: builder.UniversalBot, inputWords: string[]) => {
    if (inputWords[0] === 'connect') {
        getCustomerFromWaiting(message, bot);
        return;
    } else if (inputWords[0] === 'grab') {
        getCustomerByName(message, bot, inputWords);
        return;
    } else if (inputWords[0] === 'list') {
        let conversationList = '### Current Conversations \n';

        conversations.forEach(conversation => {
            let starterText = ' - *' + conversation.customer.user.name + '*';
            switch (ConversationState[conversation.state]) {
                case 'Bot':
                    conversationList += starterText + ' is talking to the bot\n';
                    break;
                case 'Agent':
                    conversationList += starterText + ' is talking to an agent\n';
                    break;
                case 'Waiting':
                    conversationList += starterText + ' is waiting to talk to an agent\n';
                    break;
            }
        });
        bot.send(new builder.Message().address(message.address).text(conversationList).textFormat('markdown'));
    } else {
        sendAgentCommandOptions(message, bot);
    }

}