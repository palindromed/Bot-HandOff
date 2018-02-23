import * as express from 'express';
import { Bot, MemoryStorage, BotStateManager, Middleware } from 'botbuilder';
import { BotFrameworkAdapter } from 'botbuilder-services';
import { Handoff } from './handoff';
import { commandsMiddleware } from './commands';


//=========================================================
// Bot Setup
//=========================================================

const app = express();

// Setup Express Server
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});
// Create chat bot
const adapter = new BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

app.post('/api/messages', <any>adapter.listen());

// Create endpoint for agent / call center
app.use('/webchat', express.static('public'));

// replace this function with custom login/verification for agents
const isAgent = (context: BotContext) => {
    return context.conversationReference.user.name.startsWith("Agent") || context.state.conversation.isAgent;
};
const agentLoginMiddleware: Middleware = {
    receiveActivity: (context, next) => {
        // agent login middleware. Note that this is only for the purpose of the demo
        // replace this with actual proper login mechanism. @see isAgent function
        if (context.request.type === 'message' && context.request.text.startsWith('/login agent')) {
            context.state.conversation.isAgent = true;
        }
        return next();
    }
};

let bot = new Bot(adapter);
const handoff = new Handoff(bot, isAgent);
// Initialize bot by passing it adapter and middleware
// - Add storage so that we can track conversation & user state.
// - Add a receiver to process incoming activities.
bot = bot
    .use(new MemoryStorage())
    .use(new BotStateManager())
    .use(agentLoginMiddleware)
    .use(commandsMiddleware(handoff))
    .use(handoff.routingMiddleware())
    .onReceive((context) => {
        if (context.request.type === 'message') {
            let count = context.state.conversation.count || 1;
            context.reply(`${count}: You said "${context.request.text}"`);
            context.state.conversation.count = count + 1;
        }
    });




