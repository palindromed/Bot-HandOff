module.exports = function () {

    global.User = function (args) {
        this.text = args.text,
        this.addy = args.address
        this.isAgent = args.user.isStaff || false,
        this.lastActivity = args.timestamp,
        this.talkingToAgent = false 
    };

    global.User.prototype.connectUserToAgent = function (moredata) {


    };
    global.User.prototype.getUser = function () {

    }

    global.users = {};

    global.agents = {};
}