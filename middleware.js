module.exports = {

    incoming: function (message, bot, builder) {
        console.log('conversations/state')
        console.log(global.conversations);
        console.log('************');

        // find out who is talking / add new convo if not found
        if (message.user.id === 'scott') {
            var convo = Object.keys(global.agent)
            convo  = global.agent[convo[0]];
            var msg = new builder.Message()
                .address(convo.address)
                .text(message.text);
            bot.send(msg, function (args) {
                console.log(args);

            });
        }

        // who should they be talking to

        // make it so


        // if talking to Agent/waiting for agent, suppress default bot functionality (how if on a prompt and it's looking for a certain response? override somehow)

    },

}
