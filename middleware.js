module.exports = {

    incoming: function (message, bot, builder, next) {
        console.log('conversations/state')
        console.log(global.conversations);
        console.log('************');
        console.log('users');
        console.log(global.users);
        console.log('agents');
        console.log(global.agent);

        if (message.type === 'message') { // saves a ping from adding a user/agent

            // find out who is talking / add new convo if not found
            if (message.user.isStaff) { // move logic to an API for agents
                var agentConversationId = message.address.conversation.id;
                var agentAddress = global.conversations[agentConversationId];
                if (typeof agentAddress === 'undefined') { // agent not in state yet, add them ****This will happen for each conversation, not agent.
                    global.agent.push(agentConversationId);
                    global.conversations[agentConversationId] = { address: message.address };
                    message.text = 'test';
                } else if (agentAddress.userAddress) {
                    var msg = new builder.Message()
                        .address(agentAddress.userAddress)
                        .text(message.text);
                    bot.send(msg);
                }
            }
            // End Agent

            // Setting User state logic
            else {
                var userId = message.address.conversation.id;
                var thisUser = global.conversations[userId];
                // Add a user not yet in state
                if (typeof thisUser === 'undefined') {
                    global.conversations[userId] = { transcript: [message], address: message.address, status: 'Talking_To_Bot' };
                } else {
                    // get spread operator? 
                    global.conversations[userId].transcript.push(message);

                    if (message.text === 'help' && thisUser.status === 'Talking_To_Bot') {
                        // user initiated connect to agent
                        global.conversations[message.address.conversation.id] = Object.assign({}, global.conversations[message.address.conversation.id], { 'status': 'Finding_Agent' });
                        global.users.push(message.address.conversation.id);

                    } else if (message.text === 'done' && thisUser.status === 'Talking_To_Agent') {
                        // deal with disconnecting agent as well
                        delete thisUser.agentAddress;
                        global.conversations[userId] = Object.assign({}, thisUser, { 'status': 'Talking_To_Bot' });
                        // bot.beginDialog(message.address, '/');

                    }
                }


                switch (thisUser.status) {
                    case 'Finding_Agent':
                        var msg = new builder.Message()
                            .address(message.address)
                            .text('Please hold while I find an agent');
                        bot.send(msg);
                        // finding agent and connecting the 2 
                        if (global.agent.length >= 1) {
                            var myAgent = global.conversations[global.agent[0]];
                            global.conversations[userId] = Object.assign({}, thisUser, { agentAddress: myAgent.address, 'status': 'Talking_To_Agent' });
                            global.conversations[myAgent.address.conversation.id] = Object.assign({}, myAgent, { userAddress: thisUser.address });
                        }
                        break;
                    case 'Talking_To_Agent':
                        var msg = new builder.Message()
                            .address(global.conversations[userId].agentAddress)
                            .text(message.text);
                        bot.send(msg);
                        break;
                    case 'Talking_To_Bot':
                        message.text = 'talk to bot';
                        next();
                        break;
                    default:
                        break;

                }

            }
        }
    }
}
