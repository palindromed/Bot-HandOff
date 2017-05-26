# Bot-HandOff

A common request from companies and organizations considering bots is the ability to "hand off" a customer from a bot to a human agent, as seamlessly as possible.

This project implements an unopinionated core framework called **Handoff** which enables bot authors to implement a wide variety of scenarios, including a full-fledged call center app, with minimal changes to the actual bot.

It also includes a very simple implementation that illustrates the core concepts with minimal configuration.

This project is in heavy flux, but is now in a usable state. However this should still be considered a sample, and not an officially supported Microsoft product.

This project is written in TypeScript.

## Basic Usage

```javascript
import * as bot_handoff from 'bot_handoff';

.
.
.

/**
After all initial bot setup, paste in the following code:
**/

//=========================================================
// Hand Off Setup
//=========================================================
/** 
MongooseProvidor is using a mongo db connection string. 
It is looking for this this variable in your environemnt:
    MONGODB_PROVIDER
**/
const mongooseProvider = new bot_handoff.MongooseProvider();

// Replace this function with custom login/verification for agents
const isAgent = (session: builder.Session) => session.message.user.name.startsWith("Agent");
const isOperator = (session: builder.Session) => session.message.user.name.startsWith("Operator");

const handoff = new bot_handoff.Handoff(bot, isAgent, isOperator);

//=========================================================
// API

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Endpoint to get current conversations
app.get('/api/conversations', async (req, res) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    console.log(req.headers);
    if (authHeader) {
        if (authHeader === 'Bearer ' + process.env.MICROSOFT_DIRECTLINE_SECRET) {
            let conversations = await mongooseProvider.getCurrentConversations()
            res.status(200).send(conversations);
        }
    }
    res.status(401).send('Not Authorized');
});

// Endpoint to trigger handover
app.post('/api/conversations', async (req, res) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    console.log(req.headers);
    if (authHeader) {
        if (authHeader === 'Bearer ' + process.env.MICROSOFT_DIRECTLINE_SECRET) {
            if (await handoff.queueCustomerForAgent({ customerConversationId: req.body.conversationId })) {
                res.status(200).send({"code": 200, "message": "OK"});
            } else {
                res.status(400).send({"code": 400, "message": "Can't find conversation ID"});
            }
        }
    } else {
        res.status(401).send({"code": 401, "message": "Not Authorized"});
    }
});

//=========================================================
// Middleware

bot.use(
    bot_handoff.commandsMiddleware(handoff),
    handoff.routingMiddleware(),
);


```

Required environment variables:
```
"MICROSOFT_APP_ID" : "",
"MICROSOFT_APP_PASSWORD" : "",
"MICROSOFT_DIRECTLINE_SECRET" : "",
"MONGODB_PROVIDER" : ""      
```

See example folder for a full bot example.

## License

MIT License
