module.exports = {

    incoming: function (message, bot, builder, next) {
        console.log(message);
        console.log('conversations/state')
        console.log(global.conversations);
        console.log('users');
        console.log(global.users);
        console.log('agents');
        console.log(global.agent);

        if (message.type === 'message') { 
            if (message.user.isStaff) {
                var agentConversationId = message.address.conversation.id;
                var agentAddress = global.conversations[agentConversationId];
                if (typeof agentAddress === 'undefined') { // agent not in state yet, add them ****This will happen for each conversation, not agent.
                    global.agent.push(agentConversationId);
                    global.conversations[agentConversationId] = { address: message.address };
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
                        thisUser = Object.assign({}, global.conversations[message.address.conversation.id], { 'status': 'Finding_Agent' });
                        global.conversations[userId] =  thisUser;
                        global.users.push(message.address.conversation.id);

                    } else if (message.text === 'done' && thisUser.status === 'Talking_To_Agent') {
                        // deal with disconnecting agent as well
                        delete thisUser.agentAddress;
                        thisUser = Object.assign({}, thisUser, { 'status': 'Talking_To_Bot' });
                        global.conversations[userId] = thisUser;
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
                        next();
                        break;
                    default:
                        break;

                }

            }
        }
    }
}
