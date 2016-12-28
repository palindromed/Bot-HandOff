module.exports = function() {
    var addressBook = {};

    var incoming = function (message, args) {
        // addressBook[message.address.user.id] = message.address

        console.log(addressBook);
        console.log('************');
        return message;
    };
    var outgoing = function (message, args) {
        console.log(args);
        console.log('===========');
        // message.text = 'Outgoing test';
        return message

    }
}
