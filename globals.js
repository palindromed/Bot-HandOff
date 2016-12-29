module.exports = function () {
    // global.addressBook = {};

    global.User = function (args) {
        this.text = args.text,
            this.addy = args.address
        this.isAgent = args.user.isStaff || false,
            this.lastActivity = args.timestamp
    };

    global.userList = [];

    global.users = {};
    global.agents = {};
}