"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agent = 'botbuilder';
exports.messageType = 'message';
exports.invokeType = 'invoke';
exports.defaultConnector = '*';
exports.defaultLocale = '*';
exports.emulatorChannel = 'emulator';
exports.intentEntityType = 'intent';
exports.Errors = {
    EMSGSIZE: 'EMSGSIZE',
    EBADMSG: 'EBADMSG'
};
exports.Library = {
    system: 'BotBuilder',
    default: '*'
};
exports.Data = {
    SessionState: 'BotBuilder.Data.SessionState',
    SessionId: 'BotBuilder.Data.SessionId',
    Handler: 'BotBuilder.Data.Handler',
    Group: 'BotBuilder.Data.Group',
    Intent: 'BotBuilder.Data.Intent',
    WaterfallStep: 'BotBuilder.Data.WaterfallStep',
    Form: 'BotBuilder.Data.Form',
    Field: 'BotBuilder.Data.Field',
    FirstRunVersion: 'BotBuilder.Data.FirstRunVersion',
    PreferredLocale: 'BotBuilder.Data.PreferredLocale',
    DebugAddress: 'BotBuilder.Data.DebugAddress',
    DebugWatches: 'BotBuilder.Data.DebugWatches'
};
exports.DialogId = {
    FirstRun: 'BotBuilder:FirstRun',
    ConfirmCancel: 'BotBuilder:ConfirmCancel',
    ConfirmInterruption: 'BotBuilder:ConfirmInterruption',
    Interruption: 'BotBuilder:Interruption',
    Disambiguate: 'BotBuilder:Disambiguate'
};
exports.Id = {
    DefaultGroup: 'BotBuilder.Id.DefaultGroup'
};
exports.Intents = {
    Default: 'BotBuilder.DefaultIntent',
    Response: 'BotBuilder.ResponseIntent',
    Repeat: 'BotBuilder.RepeatIntent'
};
exports.Entities = {
    Response: 'BotBuilder.Entities.Response',
    Number: 'number',
    String: 'string',
    Date: 'date',
    Boolean: 'boolean',
    Match: 'match'
};
