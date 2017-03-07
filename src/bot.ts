import * as builder from 'botbuilder';
import dialogs from './dialogs/';
import Handoff from './middleware/handoff';
import commandsMiddleware from './middleware/commands';

export default class bot_handler {

    private bot;
    private connector;
    private handoff;
    private isAgent;

    constructor(){
        // Create chat bot
        this.connector = new builder.ChatConnector({
            appId: process.env.MICROSOFT_APP_ID,
            appPassword: process.env.MICROSOFT_APP_PASSWORD
        });

        this.bot = new builder.UniversalBot(this.connector);

        // replace this function with custom login/verification for agents
        this.isAgent = (session: builder.Session) =>
            session.message.user.name.startsWith("Agent");

        this.handoff = new Handoff(this.bot, this.isAgent);

        this.SetBotMiddleware();
        this.SetBotDialog();
    }

    private SetBotMiddleware(){
        this.bot.use(
            commandsMiddleware(this.handoff),
            this.handoff.routingMiddleware(),
            /* other bot middlware should probably go here */
        );
    }

    private SetBotDialog(){
        this.bot.dialog('/', dialogs);
    }

    public getConnector(){
        return this.connector;
    }
}

