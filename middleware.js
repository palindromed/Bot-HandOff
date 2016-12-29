module.exports = {

    incoming: function (message, args) {
        console.log(args);
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
        console.log(global.agents);
        console.log(global.users);
        console.log('************');
        // message.text = 'This is a test';
        return message;
    },

    outgoing: function (message, args) {
        console.log(args);
        console.log('===========');
        message.text = 'Outgoing test';
        return message
    },

}
