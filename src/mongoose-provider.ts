import * as builder from 'botbuilder';
import * as bluebird from 'bluebird';
import mongoose = require('mongoose');
mongoose.Promise = bluebird;

import { By, Conversation, Provider, ConversationState } from './handoff';

// -------------------
// Bot Framework types
// -------------------
export const IIdentitySchema = new mongoose.Schema({
    id: { type: String, required: true },
    isGroup: { type: Boolean, required: false },
    name: { type: String, required: false },
}, {
        _id: false,
        strict: false,
    });

export const IAddressSchema = new mongoose.Schema({
    bot: { type: IIdentitySchema, required: true },
    channelId: { type: String, required: true },
    conversation: { type: IIdentitySchema, required: false },
    user: { type: IIdentitySchema, required: true },
    id: { type: String, required: false },
    serviceUrl: { type: String, required: false },
    useAuth: { type: Boolean, required: false }
}, {
        strict: false,
        id: false,
        _id: false
    });

// -------------
// Handoff types
// -------------
export const TranscriptLineSchema = new mongoose.Schema({
    timestamp: {},
    from: String,
    text: String
});

export const ConversationSchema = new mongoose.Schema({
    customer: { type: IAddressSchema, required: true },
    agent: { type: IAddressSchema, required: false },
    state: {
        type: Number,
        required: true,
        min: 0,
        max: 2
    },
    transcript: [TranscriptLineSchema]
});
export interface ConversationDocument extends Conversation, mongoose.Document { }
export const ConversationModel = mongoose.model<ConversationDocument>('Conversation', ConversationSchema)

export const BySchema = new mongoose.Schema({
    bestChoice: Boolean,
    agentConversationId: String,
    customerConversationId: String,
    customerName: String
});
export interface ByDocument extends By, mongoose.Document { }
export const ByModel = mongoose.model<ByDocument>('By', BySchema);
export {mongoose};
// -----------------
// Mongoose Provider
// -----------------
export class MongooseProvider implements Provider {
    public init(): void {
        //mongoose.connect(process.env.MONGODB_PROVIDER);
    }

    async addToTranscript(by: By, text: string, from: string): Promise<boolean> {
        const conversation: Conversation = await this.getConversation(by);
        if (!conversation) return false;
        conversation.transcript.push({
            timestamp: Date.now(),
            from: from,
            text
        });
        return await this.updateConversation(conversation);
    }

    async connectCustomerToAgent(by: By, agentAddress: builder.IAddress): Promise<Conversation> {
        const conversation = await this.getConversation(by);
        if (conversation) {
            conversation.state = ConversationState.Agent;
            conversation.agent = agentAddress;
        }
        const success = await this.updateConversation(conversation);
        if (success)
            return conversation;
        else
            return null;
    }

    async queueCustomerForAgent(by: By): Promise<boolean> {
        const conversation = await this.getConversation(by);
        if (!conversation) {
            return false;
        } else {
            conversation.state = ConversationState.Waiting;
            return await this.updateConversation(conversation);
        }
    }

    async connectCustomerToBot(by: By): Promise<boolean> {
        const conversation = await this.getConversation(by);
        if (!conversation) {
            return false;
        } else {
            conversation.state = ConversationState.Bot;
            if (conversation.agent) {
                return await this.deleteConversation(conversation);
            } else {
                return await this.updateConversation(conversation);
            }
        }
    }

    async getConversation(by: By, customerAddress?: builder.IAddress): Promise<Conversation> {
        if (by.customerName) {
            return await ConversationModel.findOne({ 'customer.user.name': by.customerName });
        } else if (by.agentConversationId) {
            const conversation = await ConversationModel.findOne({ 'agent.conversation.id': by.agentConversationId });
            if (conversation) return conversation;
            else return null;
        } else if (by.customerConversationId) {
            let conversation: Conversation = await ConversationModel.findOne({ 'customer.conversation.id': by.customerConversationId });
            if (!conversation && customerAddress) {
                conversation = await this.createConversation(customerAddress);
            }
            return conversation;
        }
        return null;
    }

    async getCurrentConversations(): Promise<Conversation[]> {
        let conversations;
        try {
            conversations = await ConversationModel.find();
        } catch (error) {
            console.log('Failed loading conversations');
            console.log(error);
        }
        return conversations;
    }

    private async createConversation(customerAddress: builder.IAddress): Promise<Conversation> {
        return await ConversationModel.create({
            customer: customerAddress,
            state: ConversationState.Bot,
            transcript: []
        });
    }

    private async updateConversation(conversation: Conversation): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            ConversationModel.findByIdAndUpdate((conversation as any)._id, conversation).then((error) => {
                resolve(true)
            }).catch((error) => {
                console.log('Failed to update conversation');
                console.log(conversation as any);
                resolve(false);
            });
        });
    }

    private async deleteConversation(conversation: Conversation): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            ConversationModel.findByIdAndRemove((conversation as any)._id).then((error) => {
                resolve(true);
            })
        });
    }
}