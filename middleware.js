module.exports = {

    incoming: function (message, args) {
        // already exists
        // create new obj
        // is call center / agent
 
        console.log(args);
        if (message.user.isStaff) {
            global.myOrchestrator.agents[message.user.id] = new global.User(message);
        } else {
            global.myOrchestrator.users[message.user.id] = new global.User(message);
        }
        console.log(global.myOrchestrator.agents);
        console.log(global.myOrchestrator.users);
        
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
