module.exports = function () {

    global.User = function (args) {
        this.transcript = args.text,
        this.address = args.address
        this.isAgent = args.user.isStaff || false,
        this.lastActivity = args.timestamp, // use to decide which conversations are 'current'. Let devs choose appropriate delta
        this.talkingToAgent = false, // may get rid of this. if alt addy can be an address or false, simple if can choose routing
        routeMsgsTo = false // alternative to setting flag and changing address in user obj
    };
    global.Agent = function (args) {
        // keep track of convos part of
        // available/logged in flag/functionality?
    }

    global.users = {};

    global.agents = {};
}