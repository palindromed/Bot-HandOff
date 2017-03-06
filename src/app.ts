import * as express from 'express';
import BotHandler from './bot';

const app = express();
const bot = new BotHandler();

// Setup Express Server
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});

app.post('/api/messages', bot.getConnector().listen());

// Create endpoint for agent / call center
app.use('/webchat', express.static('public'));




