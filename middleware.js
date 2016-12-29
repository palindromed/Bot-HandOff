module.exports = {
    
    incoming: function(message, args) {
        // already exists
        // create new obj
        // is call center / agent

        console.log(args);
        console.log(global.addressBook);
        console.log('************');
        var newUser = new global.User(message);
        global.userList.append(newUser)
        console.log(newUser)
        console.log(global.userList);

        // message.text = 'This is a test';
        return message;
    },
    outgoing: function(message, args) {
        console.log(args);
        console.log('===========');
        message.text = 'Outgoing test';
        return message 

    } 
}
