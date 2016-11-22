"use strict";
const wrapper = function () {
    let self = this;
    const azure = require('azure-storage');
    const entityGen = azure.TableUtilities.entityGenerator;
    let storageTableService = azure.createTableService(process.env.AZURE_STORAGE_ACCOUNT, process.env.AZURE_STORAGE_ACCESS_KEY);

    // Create/update instance of Call Center
    // Make sure available is set to true
    self.addCallCenter = (data, callback) => {
        storageTableService.createTableIfNotExists('CallCenter', (error, result, response) => {
            if (error) {
                console.log(error);
            }
        })
        let callCenterDetails = {
            PartitionKey: entityGen.String('Staff'),
            RowKey: entityGen.String(data.channelId + data.user.id),
            available: entityGen.Boolean(true),
            channelId: entityGen.String(data.channelId),
            userId: entityGen.String(data.user.id),
            conversationId: entityGen.String(data.conversation.id),
            // save whole address as a string for user to reference and talk to Call Center
            addressDetails: entityGen.String(JSON.stringify(data)),
            lastConversation: entityGen.String(),
        };
        storageTableService.insertOrMergeEntity('CallCenter', callCenterDetails, (error, response) => {
            if (error) {
                console.log('add callcenter error ', error);
            }
        })
    },
        // Find 'available' Call center and update 'lastConversation' to User contact information
        // TODO add queue to handle no call centers are available
        self.findCallCenter = (contactInfo, callback) => {
            let query = new azure.TableQuery()
                .where('PartitionKey eq ?', 'Staff')
                .and('channelId eq ?', 'skype')
                .and('available eq ?', true);

            storageTableService.queryEntities('CallCenter', query, null, (error, args) => {
                if (args.entries && args.entries.length > 0) {
                    // Take first available Call Center, update available and lastConversation
                    let callCenterHuman = args.entries[0];
                    callCenterHuman.lastConversation = { '_': JSON.stringify(contactInfo) };
                    callCenterHuman.available = { '_': false };
                    storageTableService.mergeEntity('CallCenter', callCenterHuman, (error, result, response) => {
                        if (!error) {
                            callback(callCenterHuman.addressDetails);
                        } else {
                            console.log(error);
                        }
                    });
                } else {
                    // Add logic for queueing here
                    callback(null);
                }
            });
        },
        // This is where call center gets contact information to relevant user
        self.connectToUser = (conversationId, callback) => {
            let query = new azure.TableQuery()
                .where('PartitionKey eq ?', 'Staff')
                .and('channelId eq ?', 'skype')
                .and('conversationId eq ?', conversationId);

            storageTableService.queryEntities('CallCenter', query, null, (error, result, response) => {
                if (error) {
                    console.log(error);
                } else {
                    callback(JSON.parse(result.entries[0].lastConversation._));
                }
            })
        },
        // Remove contact information for last conversation and mark as available for calls
        self.disconnectFromUser = (connectedUser, callback) => {
            let query = new azure.TableQuery()
                .where('PartitionKey eq ?', 'Staff')
                .and('channelId eq ?', 'skype')
                .and('conversationId eq ?', connectedUser.conversation.id)
                .and('userId eq ?', connectedUser.user.id);
            storageTableService.queryEntities('CallCenter', query, null, (error, args) => {
                let thisCallCenter = args.entries[0];
                thisCallCenter.lastConversation = { '_': '' };
                thisCallCenter.available = { '_': true };
                storageTableService.mergeEntity('CallCenter', thisCallCenter, (error, result, response) => {
                    if (error) {
                        console.log(error);
                    }
                });
            });
        },
        self.addUser = (item, myText) => {
            storageTableService.createTableIfNotExists('User', (error, result, response) => {
                if (error) {
                    console.log(error);
                }
            });
            let userDetails = {
                PartitionKey: entityGen.String('User'),
                RowKey: entityGen.String(item.channelId + item.user.id),
                userId: entityGen.String(item.user.id),
                conversationId: entityGen.String(item.conversation.id),
                transcript: entityGen.String(myText),
            };
            storageTableService.insertOrMergeEntity('User', userDetails, (error, result, response) => {
                if (error) {
                    console.log('Error with adding user: ' + error);

                }
            });
        },
        // TODO decide if saving text is enough
        // Could also store zipped conversation
        self.transcribeUser = (data, botText, userText, callback) => {
            storageTableService.createTableIfNotExists('User', (error, result, response) => {
                if (error) {
                    console.log(error);
                }
            })
            let query = new azure.TableQuery()
                .where('PartitionKey eq ?', 'User')
                .and('conversationId eq ?', data.conversation.id)
                .and('userId eq ?', data.user.id);
            storageTableService.queryEntities('User', query, null, (error, result, response) => {
                let thisUser = result.entries[0];
                thisUser.transcript = { '_': thisUser.transcript._ + ' bot: ' + botText + ' user: ' + userText + ' ' };
                storageTableService.insertOrMergeEntity('User', thisUser, (error, result, response) => {
                    if (error) {
                        console.log(error);
                    }
                });
            })
        },
        // Get transcript for call center to see previous user conversation
        self.getTranscript = (conversationId, userId, callback) => {
            let query = new azure.TableQuery()
                .where('PartitionKey eq ?', 'User')
                .and('conversationId eq ?', conversationId)
                .and('userId eq ?', userId);
            storageTableService.queryEntities('User', query, null, (error, result, response) => {
                if (error) {
                    console.log(error);
                }
                callback(result.entries[0].transcript._);
            });
        }

};

module.exports = new wrapper();