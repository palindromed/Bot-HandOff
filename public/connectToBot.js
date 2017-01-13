$(function () {

    $('#logon-form').on('submit', function (event) {
        event.preventDefault();
        $('#logon-form').hide();
        var params = {};
        location
            .search
            .substring(1)
            .split("&")
            .forEach(function (pair) {
                var p = pair.split("=");
                params[p[0]] = decodeURIComponent(p[1]);
            });

        var botConnection = new BotChat.DirectLine({
            secret: process.env.SECRET,
            token: params['t'],
            domain: params['domain'],
            webSocket: true
        });


        var user = {
            id: $('#user-id').val(),
            name: $('#user-id').val()
        };

        var bot = {
            id: params['botid'] || 'botid',
            name: params["botname"] || 'botname'
        };

        BotChat.App({
            botConnection: botConnection,
            user: user,
            bot: bot,
        }, document.getElementById("BotChatGoesHere"));


    });



});