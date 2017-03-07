var params = {};
location
    .search
    .substring(1)
    .split("&")
    .forEach(function (pair) {
        var p = pair.split("=");
        params[p[0]] = decodeURIComponent(p[1]);
    });

var bot = {
    id: params['botid'] || 'botid',
    name: params["botname"] || 'botname'
};

var logon_form = document.getElementById('logon-form');
var user_id = document.getElementById('user-id')

logon_form.onsubmit = e => {
    console.log("here I am");
    e.preventDefault();
    e.stopPropagation();
    logon_form.style.display = 'none';

    var user = {
        id: user_id.value,
        name: user_id.value
    }

    Agent.App({
        directLine: { secret: params['s'] },
        user: user,
        bot: bot,
    }, document.getElementById("BotChatGoesHere"));
}

