"use strict";
const builder = require("botbuilder");
const globals_1 = require("./globals");
const addToTranscript = (transcript, message) => {
    console.log("transcribing message", message);
    transcript.push({
        timestamp: message.timestamp,
        from: message.address,
        text: message.text
    });
};
exports.route = (event, bot, next) => {
    console.log("middleware event", event);
    console.log("conversations", globals_1.conversations);
    switch (event.type) {
        case 'message':
            const message = event;
            if (message.user.name.startsWith("Agent")) {
                console.log("message from agent");
                // If we're hearing from an agent they are already part of a conversation
                const conversation = globals_1.conversations.find(conversation => conversation.agent.conversation.id === message.address.conversation.id);
                if (!conversation) {
                    let waitingUsers = globals_1.conversations.filter((x) => x.state === globals_1.ConversationState.Waiting);
                    console.log(waitingUsers);
                    if (waitingUsers.length === 0) {
                        bot.send(new builder.Message().address(message.address).text("You are no longer in conversation with the user. No users waiting"));
                        // connect this agent to that user
                        return;
                    }
                    else {
                        // waitingUsers.sort((x: any, y: any) => x.transcript[x.transcript.length - 1].timestamp - y.transcript[y.transcript.length - 1].timestamp)
                        console.log('=========================');
                        waitingUsers[0].agent = message.address;
                        waitingUsers[0].state = globals_1.ConversationState.Agent;
                        return;
                    }
                }
                if (conversation.state !== globals_1.ConversationState.Agent) {
                    bot.send(new builder.Message().address(message.address).text("Shouldn't be in this state - agent should have been cleared out."));
                    console.log("Shouldn't be in this state - agent should have been cleared out");
                    return;
                }
                console.log("passing agent message to user");
                addToTranscript(conversation.transcript, message);
                bot.send(new builder.Message().address(conversation.customer).text(message.text));
                return;
            }
            else {
                console.log("message from customer");
                let conversation = globals_1.conversations.find(conversation => conversation.customer.conversation.id === message.address.conversation.id);
                if (!conversation) {
                    // first time caller, long time listener
                    conversation = {
                        customer: message.address,
                        state: globals_1.ConversationState.Bot,
                        transcript: []
                    };
                    globals_1.conversations.push(conversation);
                }
                addToTranscript(conversation.transcript, message);
                switch (conversation.state) {
                    case globals_1.ConversationState.Bot:
                        if (message.text === 'help') {
                            console.log("switching to Waiting");
                            conversation.state = globals_1.ConversationState.Waiting;
                            bot.send(new builder.Message().address(message.address).text("Connecting you to the next available agent."));
                            return;
                        }
                        console.log("pasing message to bot");
                        return next();
                    case globals_1.ConversationState.Waiting:
                        console.log("ignore message while waiting");
                        bot.send(new builder.Message().address(message.address).text("Connecting you to the next available agent."));
                        return;
                    case globals_1.ConversationState.Agent:
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
    }
};
