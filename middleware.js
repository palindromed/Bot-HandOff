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
        // var thisUser = global.agents[0] || global.users[0];


        if (message.text) {
            if (message.user.isStaff) {
                global.agents[0] = new global.User(message);
            } else {
                global.users[0] = new global.User(message);
            }
        }
        message.text = 'Receive wins';
        console.log('agents');
        console.log(global.agents);
        console.log('users')
        console.log(global.users);
        console.log('************');
        console.log(thisUser);
        
        return message;
    },

    outgoing: function (message, args) {
        console.log(args);
        console.log('===========');
        // if (message.address.user.id === 'hannah') {
        //     console.log('I am staff');
        //     message.address = global.users[0].addy;
        // } else {
        //     message.address = global.agents[0].addy;
        // }
        console.log(global.agents);
        console.log(global.users);
        message.text = 'send wins';

        return message
    },

    connectToAgent: function (data) {


    }
}
