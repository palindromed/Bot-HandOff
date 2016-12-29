module.exports = {

    incoming: function (message, args) {
        console.log(args);
        console.log('agents');
        console.log(global.agents);
        console.log('users')
        console.log(global.users);
        console.log('************');
        // console.log(args.address.conversation);
        // add info to objs
        // access data from existing options

        // 1 try looking up an existing objs
        // 2 update info if found
        // make routing decision based on info -- this prob goes to sent
        // 3 if not found, create
        // var thisUser = global.agents[0] || global.users[0];


        if (message.text) {
            if (message.user.isStaff) {
                global.agents[message.user.id] = new global.User(message);
            } else {
                global.users[message.user.id] = new global.User(message);
            }
        }
        // console.log(thisUser);

        return message;
    },

    outgoing: function (message, args) {
        console.log(message.address);
        console.log(args);

        if (message.address.user.id === 'hannah') {
            console.log('I am staff');
            message.address = {
                id: '8QU8d7tzUTb|000000000000000001',

                channelId: 'directline',

                user: { id: 'scott', name: 'scott' },

                conversation: { id: '8QU8d7tzUTb' },

                bot: { id: 'handoffbotdev@Vyk0lb3f67A', name: 'HandOffBot' },

                serviceUrl: 'https://directline.botframework.com',

                useAuth: true
            }

        } else {
            message.address = {
                id: '3aECIsrKtz2|000000000000000003',

                channelId: 'directline',

                user: { id: 'hannah', name: 'hannah', isStaff: true },

                conversation: { id: '3aECIsrKtz2' },

                bot: { id: 'handoffbotdev@Vyk0lb3f67A', name: 'HandOffBot' },

                serviceUrl: 'https://directline.botframework.com',

                useAuth: true
            }
        }


        console.log('address');
        console.log(message.address);
        console.log('===========');

        return message
    },

    connectToAgent: function (data) {


    }
}
