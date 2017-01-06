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

            if (message.text === 'help') {
                // user initiated connect to agent
                global.conversations[message.address.conversation.id] = Object.assign({}, global.conversations[message.address.conversation.id], { 'status': 'Finding_Agent' });
                message.text = 'hold on while I connect you';
                // return message
            };

            // find out who is talking / add new convo if not found
            if (message.user.isStaff) { // move logic to an API for agents
                console.log('is staff');
                var agentId = message.address.conversation.id;
                var thisAgent = global.conversations[agentId];
                if (typeof thisAgent === 'undefined') { // agent not in state yet, add them ****This will happen for each conversation, not agent.
                    global.agent.push(agentId);
                    global.conversations[agentId].address = message.address;
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
                    global.users.push(userId);
                    global.conversations[userId] = { transcript: [message], address: message.address, status: 'Talking_To_Bot' };
                    return
                } else {
                    global.conversations[userId].transcript.push(message);
                }
                // if in state, update transcript for the user

                // Check for choices to be made
                console.log('about to make the switch')
                console.log(global.conversations[userId].status);
                switch (global.conversations[userId].status) {
                    case 'Finding_Agent':
                        message.text = 'getting agent';
                        var myAgent = global.conversations[global.agent[0]];
                        // global.conversations[userId] = Object.assign({}, global.conversations[userId], { agentAddress: myAgent.address, 'status': 'Talking_To_Agent' });
                        global.conversations[userId].status = 'Talking_To_Agent';
                        
                        return message;
                        break;
                    case 'Talking_To_Agent':
                        message.text = 'talking to agent';
                        break;
                    case 'Talking_To_Bot':
                        message.text = 'talk to bot';
                        return message;
                        break;
                    default:
                        message.text = 'defaulting';
                        return message;
                        break;

                }

            }
        }
        // if talking to Agent/waiting for agent, suppress default bot functionality (how if on a prompt and it's looking for a certain response? override somehow)
    }
}
