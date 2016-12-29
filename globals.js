module.exports = function() {
    global.addressBook = {};

    global.User = function(args) {
        this.text = args.text,
        this.addy = args.address
    };
    global.userList = ['user1'];
}