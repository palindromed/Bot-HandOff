import { BotTester } from 'bot-tester';
import * as handoff from './../src';
import * as chai from 'chai';
import 'mocha';
import * as Promise from 'bluebird';
import * as builder from 'botbuilder';
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from 'constants';
import * as express from 'express';

const { MongoClient } = require('mongodb');
const { expect } = chai;

const isAgent = (session: builder.Session) => session.message.user.name.startsWith("Agent");

console.log(handoff);

const userAddress: builder.IAddress = { channelId: 'console',
    user: { id: 'user', name: 'user' }, 
    bot: { id: 'bot', name: 'Bot' },
    conversation: { id: 'userConversation' } 
};

const agentAddress: builder.IAddress= { channelId: 'console',
    user: { id: 'Agent', name: 'Agent' }, 
    bot: { id: 'bot', name: 'Bot' },
    conversation: { id: 'agentConversation' } 
};

const MONGO_PORT = 26017;
const MONGO_CONNECTION_STRING = `mongodb://localhost:${MONGO_PORT}/test`;

describe('handoff tests', () => {
    let db;
    let app;
    let bot;
    let server;

    before((done) => {
        MongoClient.connect(MONGO_CONNECTION_STRING, (err, database) => {
            if(err) throw err;

            db = database;

            const connector = new builder.ConsoleConnector();
            app = express();

            bot = new builder.UniversalBot(connector);

            connector.listen();

            bot.dialog('/', (session) => {
                session.send('Echo ' + session.message.text)
            });

            server = app.listen(3978, '::', () => {
                console.log('Server Up');
            });


            handoff.setup(bot, app, isAgent, {
                mongodbProvider: MONGO_CONNECTION_STRING,
                directlineSecret: 'this can be anything',
                retainData: false,
                customerStartHandoffCommand: 'HELP'
            });

            done()
        });
    });

    after((done) => {
        server.close(() => db.close(done));
    })

    afterEach((done) => {
        db.dropDatabase(done);
    })

    it('can switch from bot to agent control', () => {
        const {
            executeDialogTest,
            sendMessageToBot,
            InspectSessionDialogStep,
            SendMessageToBotDialogStep
        }
        = BotTester(bot, userAddress as any);

        const userMessage = new builder.Message().text('HELP').address(userAddress).toMessage();
        const connectMessage = new builder.Message().text('connect user').address(agentAddress).toMessage();
        const testSendUserMessage = new builder.Message().text('Hi there home slice!').address(agentAddress).toMessage();
        const testSendUserReceiveMessage = new builder.Message().text('Hi there home slice!').address(userAddress).toMessage();
        const testUserResponseMessage = new builder.Message().text('how are you? I am a user').address(userAddress);
        const testAgentReceiveUserResponseMessage = new builder.Message().text('how are you? I am a user').address(agentAddress);;
        return executeDialogTest([
            new SendMessageToBotDialogStep('hey', 'Echo hey'),
            new SendMessageToBotDialogStep(userMessage, 'Connecting you to the next available agent.'),
            new SendMessageToBotDialogStep(connectMessage, 'You are connected to user', agentAddress),
            new SendMessageToBotDialogStep(testSendUserMessage, testSendUserReceiveMessage),
            new SendMessageToBotDialogStep(testUserResponseMessage, testAgentReceiveUserResponseMessage),
        ]);
    });

    it('can do more things', () => {
        expect(true).to.be.true;
    });
});
