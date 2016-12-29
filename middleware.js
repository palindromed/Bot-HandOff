module.exports = {

    incoming: function (message, args) {
        // already exists
        // create new obj
        // is call center / agent
 
        console.log(args);
        if (message.user.isStaff) {
            global.agents[message.user.id] = new global.User(message);
        } else {
            global.users[message.user.id] = new global.User(message);
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

    }
}
