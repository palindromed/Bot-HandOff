// Used in getConversation in provider. Gives context to the search and changes behavior
interface By {
    bestChoice?: true,
    agentConversationId?: string,
    customerConversationId?: string,
    customerName?: string
}

export default By; 
