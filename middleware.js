module.exports = {

    incoming: function (message, bot, builder) {
        console.log('conversations/state')
        console.log(global.conversations);
        console.log('************');
        console.log('users');
        console.log(global.users);
        console.log('agents');
        console.log(global.agent);

        if (message.text) { // saves a ping from adding a user/agent

            if (message.text === 'help' && global.conversations[message.address.conversation.id].status !== 'Finding_Agent') {
                // user initiated connect to agent
                var thisUser = global.conversations[message.address.conversation.id];
                global.conversations[message.address.conversation.id] = Object.assign({}, global.conversations[message.address.conversation.id], { 'status': 'Finding_Agent' });
                global.users.push(message.address.conversation.id);

                message.text = 'hold on while I connect you';



                // return message
            } else if (message.text === 'done') {
                global.conversations[message.address.conversation.id] = Object.assign({}, global.conversations[message.address.conversation.id], { 'status': 'User_Disconnect_From_Agent' });
            }

            // find out who is talking / add new convo if not found
            if (message.user.isStaff) { // move logic to an API for agents
                console.log('is staff');
                var agentId = message.address.conversation.id;
                var thisAgent = global.conversations[agentId];
                if (typeof thisAgent === 'undefined') { // agent not in state yet, add them ****This will happen for each conversation, not agent.
                    global.agent.push(agentId);
                    global.conversations[agentId] = { address: message.address };
                } else if (thisAgent.userAddress) {
                    var msg = new builder.Message()
                        .address(thisAgent.userAddress)
                        .text(message.text);
                    bot.send(msg);
                    message.type = 'invisible';
                    return message;

                }
            }
            // End Agent

            // Setting User state logic
            else {
                console.log('not staff');
                var userId = message.address.conversation.id;
                var thisUser = global.conversations[userId];
                // Add a user not yet in state

                if (typeof thisUser === 'undefined') {
                    console.log('got undefined');
                    global.conversations[userId] = { transcript: [message], address: message.address, status: 'Talking_To_Bot' };
                    return
                } else {
                    // thisUser = Object.assign({}, thisUser, { 'transcript': })
                    // get spread operator? 
                    global.conversations[userId].transcript.push(message);
                }
                // if in state, update transcript for the user

                // Check for choices to be made
                console.log('about to make the switch')
                console.log(thisUser.status);
                switch (thisUser.status) {
                    case 'Finding_Agent':
                        var msg = new builder.Message()
                            .address(message.address)
                            .text('Please hold while I find an agent');
                        bot.send(msg);
                        message.type = 'invisible';
                        if (global.agent.length >= 1) {
                            var myAgent = global.conversations[global.agent[0]];
                            global.conversations[userId] =  Object.assign({}, thisUser, { agentAddress: myAgent.address, 'status': 'Talking_To_Agent' });
                            global.conversations[myAgent.address.conversation.id] = Object.assign({}, myAgent, { userAddress: thisUser.address });


                        }
                        return message;
                        break;
                    case 'Talking_To_Agent':
                        message.text = 'talking to agent';
                        var msg = new builder.Message()
                            .address(global.conversations[userId].agentAddress)
                            .text(message.text);
                        bot.send(msg);
                        message.type = 'invisible';
                        return message;
                        break;
                    case 'Talking_To_Bot':
                        message.text = 'talk to bot';
                        // global.conversations[userId] = thisUser;
                        return message;
                        break;
                    case 'User_Disconnect_From_Agent':
                        message.text = 'done talking to agent';
                        delete global.conversations[userId].agentAddress;
                        bot.beginDialog(message.address, '/');
                        break;
                    default:
                        message.text = 'defaulting';
                        return message;
                        break;

                }

            }
        }
    }
}
