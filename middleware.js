module.exports = {

    incoming: function (message, args) {
        // already exists
        // create new obj
        // is call center / agent
        console.log(global.addressBook)
        console.log(args);
        console.log(global.userList);
        global.userList.push(new global.User(message))
        console.log(global.userList);
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
