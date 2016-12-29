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
        console.log(args);
        console.log('===========');
        if (message.address.user.id === 'hannah') {
            console.log('I am staff');
            message.address = global.users['hannah'].addy;
        } else {
            message.address = global.agents['scott'].addy;
        }
        console.log(global.agents);
        console.log(global.users);

        return message
    },

    connectToAgent: function (data) {


    }
}
