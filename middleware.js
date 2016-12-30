module.exports = {

    incoming: function (message, args) {
        console.log(args);
        console.log('agents')
        console.log(global.agents);
        console.log('users');
        console.log(global.users);
        console.log('************');

        // WHERE do we create a user? on first run?
        // WHEN do we update the user's address? 
        // add message to transcript && update last active to help keep track of 'current' convos

        if (message.text) { // only execute on message event
            var userConvo = message.address.user.id;
            if (!message.address.user.isStaff && !global.users[userConvo]) {
                console.log('I am adding a new user')
                global.users[userConvo] = new global.User(message);
            } else if (!message.address.user.isStaff) {
                console.log('transcript add');
                global.users[userConvo].transcript += message.text;
            } else {
                // TODO make real logic around agent
                console.log('add agent')
                global.agents[userConvo] = new global.User(message);
            }
        }
        return message;
    },

    outgoing: function (message, args) {
        console.log(args);
        console.log(message.address);

        if (global.users[message.address.user.id].routeMessagesTo) { // route user messages to agent if appropriate. Otherwise send to the bot
            message.address = global.users[message.address.user.id].routeMessagesTo;
        }

        return message
    },

    handUserToAgent: function (user) {
        console.log('hand off to agent');

        // TODO choose whether to filter for an agent, or factor out to another method
        // ALSO more complex logic (ie: logged in, less than n current conversations, what to do if no one available)
        var agent = Object.keys(global.agents);


        //  make agnostic enough that this can pass to agent from bot or another agent
        // keep in mind only letting 1 user talk to 1 agent. 1 agent can talk to many users
        global.users[user].routeMessagesTo = global.agents[agent[0]].address;


    },
    handoffToBot: function (user) {
        console.log('Hand back to bot');
        global.users[user].routeMessagesTo = false;
    },

    getCurrentConversations: function () {
        console.log('Get all current conversations now');
        // return all current conversations
        // TODO what info to return in order to render to Agent UI
    },
    transcribeConversation: function () {
        // store all messages between user/bot user/agent
        // do this in a way that speaker is obvious

    },

    getTranscriptForAgent: function () {
        // end goal is to populate a webchat window so agent seamlessly joins existing conversation
        // tied closely to transcribeConversation because of data & data shape needed to accomplish this

    },
}
