import * as builder from 'botbuilder';
import { Conversation, ConversationState, Handoff } from './handoff';
import { sendAgentCommandOptions, disconnectCustomer, currentConversations } from './helpers'

export function commandsMiddleware(handoff: Handoff) {
    return {
        botbuilder: (session: builder.Session, next: Function) => {
            if (session.message.type === 'message') {
                command(session, next, handoff);
            }
        }
    }
}

function command(
    session: builder.Session,
    next: Function,
    handoff: Handoff
) {
    if (handoff.isAgent(session)) {
        agentCommand(session, next, handoff);
    } else {
        customerCommand(session, next, handoff);
    }
}

function agentCommand(
    session: builder.Session,
    next: Function,
    handoff: Handoff
) {
    const message = session.message;
    const conversation = handoff.getConversation({ agentConversationId: message.address.conversation.id });
    const inputWords = message.text.split(' ');

    if (inputWords.length == 0)
        return;

    if (inputWords[0] === 'disconnect') {
        disconnectCustomer(conversation, handoff, session);
        return;
    }

    // Commands to execute whether connected to a customer or not
    switch (inputWords[0]) {
        case 'options':
            sendAgentCommandOptions(session);
            return;
        case 'list':
            session.send(currentConversations(handoff));
            return;
        case 'history':
            handoff.getCustomerTranscript(
                inputWords.length > 1
                    ? { customerName: inputWords.slice(1).join(' ') }
                    : { agentConversationId: message.address.conversation.id },
                session);
            return;
        case 'waiting':
            if (conversation) {
                //disconnect from current conversation if already watching/talking
                disconnectCustomer(conversation, handoff, session);
            }
            const waitingConversation: Conversation = handoff.connectCustomerToAgent(
                { bestChoice: true },
                message.address
            );
            if (waitingConversation) {
                session.send("You are connected to " + waitingConversation.customer.user.name);
                waitingConversation.transcript.forEach(entry => {
                    if (entry.toResolve) {
                        session.send(entry.toResolve);
                    } else {
                        session.send(entry.text);
                    }
                });
            } else {
                session.send("No customers waiting.");
            }
            return;
        case 'connect':
        case 'watch':
            if (conversation && inputWords.length > 1) {
                disconnectCustomer(conversation, handoff, session);
            }
            let newConversation: Conversation;
            if (inputWords[0] === 'connect') {
                newConversation = handoff.connectCustomerToAgent(
                    inputWords.length > 1
                        ? { customerName: inputWords.slice(1).join(' ') }
                        : { customerConversationId: conversation.customer.conversation.id },
                    message.address,
                    ConversationState.Agent

                );
            } else {
                if (inputWords.length > 1) {
                    // watch currently only supports specifying a customer to watch
                    newConversation = handoff.connectCustomerToAgent(
                        { customerName: inputWords.slice(1).join(' ') },
                        message.address,
                        ConversationState.Watch
                    );
                }
            }

            if (newConversation) {
                session.send("You are connected to " + newConversation.customer.user.name);
                return;
            } else {
                session.send("something went wrong.");
            }
            return;
    }
    if (conversation) {
        if (conversation.state === ConversationState.Agent) {
            return next();
        }

        if (conversation.state === ConversationState.Resolve) {
            console.log(conversation.state);
            if (inputWords[0] === 'manual') {
                session.send('The next input you give will be sent to ' + conversation.customer.user.name);
                
                session.privateConversationData['resolveIndex'] = inputWords[1];
                session.save();

                return;
            }
            if (inputWords[0] === 'pass') {
                console.log(inputWords[1]);
                conversation.transcript[parseInt(inputWords[1])].deferred.resolve();
                delete conversation.transcript[parseInt(inputWords[1])].deferred;
                delete conversation.transcript[parseInt(inputWords[1])].toResolve;
                session.send('resolved question without responding.');
                return;
            }
            try {
                let myIndex, sendToUser;
                console.log('session storage ' + session.privateConversationData.resolveIndex);
                if (session.privateConversationData.resolveIndex) {
                    // if this is the input after 'manual' option was picked
                    myIndex = parseInt(session.privateConversationData.resolveIndex);
                    sendToUser = session.message.text;
                    delete session.privateConversationData.resolveIndex;
                    session.save();
                } else {
                    myIndex = parseInt(inputWords[inputWords.length - 1]);
                    sendToUser = inputWords.slice(0, inputWords.length - 1).join(' ');
                }
                console.log(myIndex);
                console.log(typeof myIndex);
                if (conversation.transcript[myIndex].deferred) {
                    // send 'answer' to customer                        
                    conversation.transcript[myIndex].deferred.resolve(sendToUser);
                    // add message to transcript
                    // handoff.addToTranscript({ customerConversationId: conversation.customerConversationId }, sendToUser);
                    // remove the message to agent and callbacks for this Question                      
                    delete conversation.transcript[myIndex].deferred;
                    delete conversation.transcript[myIndex].toResolve;
                    session.send('sent to customer: ' + sendToUser);
                    return;
                }
            } catch (e) {
                if (e instanceof TypeError) {
                    // no index to resolve callback for, fall through to default
                    console.log('error in agent commands. passing to default functionality');
                }
            }
        }
    }
    sendAgentCommandOptions(session);
    return;
}

function customerCommand(session: builder.Session, next: Function, handoff: Handoff) {
    const message = session.message;
    if (message.text === 'help') {
        // lookup the conversation (create it if one doesn't already exist)
        const conversation = handoff.getConversation({ customerConversationId: message.address.conversation.id }, message.address);

        if (conversation.state == ConversationState.Bot) {
            handoff.addToTranscript({ customerConversationId: conversation.customer.conversation.id }, message.text);
            handoff.queueCustomerForAgent({ customerConversationId: conversation.customer.conversation.id })
            session.send("Connecting you to the next available agent.");
            return;
        }
    }

    return next();
}
