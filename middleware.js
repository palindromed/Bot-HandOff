module.exports = {

    incoming: function (message, args) {
        console.log(args);
        console.log(args.address.conversation);
        // add info to objs
        // access data from existing options

        // 1 try looking up an existing objs
        // 2 update info if found
        // make routing decision based on info -- this prob goes to sent
        // 3 if not found, create
        var thisUser = global.agents[message.user.id] || global.users[message.user.id];


        if (message.text && thisUser !== 'undefined') {
            if (message.user.isStaff) {
                global.agents[message.user.id] = new global.User(message);
            } else {
                global.users[message.user.id] = new global.User(message);
            }
        }
        console.log('agents');
        console.log(global.agents);
        console.log('users')
        console.log(global.users);
        console.log('************');
        return message;
    },

    outgoing: function (message, args) {
        console.log(args);
        console.log('===========');
        if (message.address.user.id === 'hannah') {
            message.address = {
                id: 'L8YqoKYYo7x|000000000000000001',

                channelId: 'directline',

                user: { id: 'scott', name: 'scott' },

                conversation: { id: 'AUBYa4BHo8U'  },

                bot: { id: 'handoffbotdev@Vyk0lb3f67A', name: 'HandOffBot' },

                serviceUrl: 'https://directline.botframework.com',

                useAuth: true
            }

    }
        return message
},

    connectToAgent: function (data) {


    }
}
