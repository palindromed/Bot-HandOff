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
            global.users[message.user.id] = new global.User(message);
        }

        // console.log(thisUser);

        return message;
    },

    outgoing: function (message, args) {
        console.log(message.address);
        console.log(args);

        if (message.address.user.id === 'hannah') {
            message.address = global.users['scott'].addy;
        } else {
            message.address = global.users['hannah'].addy;
        }


        console.log('address');
        console.log(message.address);
        console.log('===========');

        return message
    },

    connectToAgent: function (data) {


    }
}
