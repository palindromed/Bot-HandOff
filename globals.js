module.exports = function () {

    global.User = function (args) {
        this.transcript = args.text,
        this.address = args.address
        this.isAgent = args.user.isStaff || false,
        this.lastActivity = args.timestamp, // use to decide which conversations are 'current'
        this.routeMessagesTo = false // alternative to setting flag and changing address in user obj
    };
    global.Agent = function (args) {
        // keep track of convos part of
        // available/logged in flag/functionality?
    }

    global.users = {};

    global.agents = {};
}