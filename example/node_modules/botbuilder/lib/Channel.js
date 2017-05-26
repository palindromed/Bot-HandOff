"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channels = {
    facebook: 'facebook',
    skype: 'skype',
    msteams: 'msteams',
    telegram: 'telegram',
    kik: 'kik',
    email: 'email',
    slack: 'slack',
    groupme: 'groupme',
    sms: 'sms',
    emulator: 'emulator',
    directline: 'directline',
    webchat: 'webchat',
    console: 'console',
    cortana: 'cortana'
};
function supportsKeyboards(session, buttonCnt) {
    if (buttonCnt === void 0) { buttonCnt = 100; }
    switch (getChannelId(session)) {
        case exports.channels.facebook:
            return (buttonCnt <= 10);
        case exports.channels.kik:
            return (buttonCnt <= 20);
        case exports.channels.slack:
        case exports.channels.telegram:
            return (buttonCnt <= 100);
        default:
            return false;
    }
}
exports.supportsKeyboards = supportsKeyboards;
function supportsCardActions(session, buttonCnt) {
    if (buttonCnt === void 0) { buttonCnt = 100; }
    switch (getChannelId(session)) {
        case exports.channels.facebook:
        case exports.channels.skype:
        case exports.channels.msteams:
            return (buttonCnt <= 3);
        case exports.channels.slack:
        case exports.channels.emulator:
        case exports.channels.directline:
        case exports.channels.webchat:
        case exports.channels.cortana:
            return (buttonCnt <= 100);
        default:
            return false;
    }
}
exports.supportsCardActions = supportsCardActions;
function hasMessageFeed(session) {
    switch (getChannelId(session)) {
        case exports.channels.cortana:
            return false;
        default:
            return true;
    }
}
exports.hasMessageFeed = hasMessageFeed;
function maxActionTitleLength(session) {
    return 20;
}
exports.maxActionTitleLength = maxActionTitleLength;
function getChannelId(addressable) {
    var channelId;
    if (addressable) {
        if (addressable.hasOwnProperty('message')) {
            channelId = addressable.message.address.channelId;
        }
        else if (addressable.hasOwnProperty('address')) {
            channelId = addressable.address.channelId;
        }
        else if (addressable.hasOwnProperty('channelId')) {
            channelId = addressable.channelId;
        }
    }
    return channelId ? channelId.toLowerCase() : '';
}
exports.getChannelId = getChannelId;
