module.exports = {
    addressBook: {},

    incoming: function(message, args) {
        if (message.user.id in addressBook) {
            pass;
        } else {
            addressBook[message.address.user.id] = message.address
        }
        console.log(addressBook);
        // console.log('************');
        return message;
    },
    outgoing: function(message, args) {
        console.log(args);
        console.log('===========');
        message.text = 'Outgoing test';
        return message 

    }
}
