module.exports = {
    incoming: function(message, args) {
        console.log(args);
        console.log(message);
        message.text = 'This is a test';
        return message;
    }
}
