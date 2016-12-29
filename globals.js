module.exports = function () {

    global.User = function (args) {
        this.text = args.text,
        this.addy = args.address
        this.isAgent = args.user.isStaff || false,
        this.lastActivity = args.timestamp
    };


    global.users = {};

    global.agents = {};
}