module.exports = {
    incoming: function (message, args) {
        console.log(args);
        console.log(message);
        message.text = 'This is a test';
        return message;
    },
    outgoing: function (message, args) {
        message.address = {
            id: 'L8YqoKYYo7x|000000000000000001',

            channelId: 'directline',

            user: { id: 'scott', name: 'scott' },

            conversation: { id: 'L8YqoKYYo7x' },

            bot: { id: 'handoffbotdev@Vyk0lb3f67A', name: 'HandOffBot' },

            serviceUrl: 'https://directline.botframework.com',

            useAuth: true

        }
        return message
    }
}
