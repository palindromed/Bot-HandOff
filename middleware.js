module.exports = {

    incoming: function (message, bot, builder) {
        console.log('conversations/state')
        console.log(global.conversations);
        console.log('************');
        console.log('users');
        console.log(global.users);
        console.log('agents');
        console.log(global.agent);

        if (message.text === 'help') {
            // user initiated connect to agent
            // send something like 'hold on while I connect you'
            console.log('user typed help');
            global.conversations[message.conversation.id] = Object.assign({}, global.conversations[message.conversation.id], { findingAgent: true });
        };

        // find out who is talking / add new convo if not found
        if (message.user.isStaff) {
            // if (!global.agent.includes(message.conversation.id)) {

            global.agent.push(message.conversation.id);
            global.conversations[message.conversation.id] = Object.assign({}, global.conversations[message.conversation.id], { address: message.address })

        } else {

            global.users.push(message.conversation.id);

        };
        if (!message.user.isStaff) {
            global.conversations[message.conversation.id] = Object.assign({}, global.conversations[message.conversation.id], {
                transcript: [message],
                address: message.address
            })

            // this needs to be an array of message objects and an indication of where messages should be routed
        }
        if (global.conversation[message.conversation.id].findingAgent) {
            global.conversations[message.conversation.id] = Object.assign({}, global.conversations[message.conversation.id], { agentAddress: global.conversations[global.agent[0]].address, findingAgent: false });
        }


        // who should they be talking to

        // make it so


        // if talking to Agent/waiting for agent, suppress default bot functionality (how if on a prompt and it's looking for a certain response? override somehow)

    }

}
