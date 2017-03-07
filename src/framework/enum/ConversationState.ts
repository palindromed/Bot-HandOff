// Options for state of a conversation
// Customer talking to bot, waiting for next available agent or talking to an agent
enum ConversationState {
    Bot,
    Waiting,
    Agent
}

export default ConversationState;
