module.exports = {
    incoming: function(message, args) {
        console.log(args);
        console.log(message);
        message.text = 'This is a test';
        return message;
    },
    outgoing: function(message, args) {
        console.log(args);
        console.log(message);
        message.text = 'Outgoing test';
        return message 

    }
}
