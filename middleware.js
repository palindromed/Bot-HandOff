module.exports = function() {
    var state = {};
    
    var incoming = function(message, args) {
        console.log(args);
        console.log('************');
        message.text = 'This is a test';
        return message;
    };
    var outgoing = function(message, args) {
        console.log(args);
        console.log('===========');
        // message.text = 'Outgoing test';
        return message 

    }
}
