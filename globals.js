module.exports = function () {
    global.User = function (args) {
        return 'here we are';
        // this.user = args.user.id,
        //     this.address = args.address,
        //     this.lastActivity = args.timestamp,
        //     this.transcript = args.text,
        //     this.agentId = false,
        //     this.isAgent = args.user.isStaff

    };
    global.userList = [];
};