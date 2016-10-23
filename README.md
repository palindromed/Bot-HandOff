# Bot-HandOff

This is example code to show how a bot built in node.js with the Microsoft Bot Builder could hand off control to a human.
This could be helpful in a bot where clients may have questions not answered by the bot.

For each of these scenarios there are two parties involved:

1. User - this is the client using the bot
2. Call Center - this would be a staff person supporting the bot and answering questions


There are three scenarios included in this repository:

1. This is the Simple escalate example. The User interacts with the bot then explicitly asks for help.
   The request for help can come from a button or user input depending on how you prefer your bot to function.
   Once the user asks for help, there is a db query to find available Call Center then the User sends a message to Call Center asking for help.
   Call center then accepts and input on either side is sent to the other bot. Specific text input ends this functionality.

2. This is an escalate with the option for Call Center to read a transcript of what has been happening in the conversation so far.
   Two things make this different from the first, you will see all the places where 'transcribeUser' is called. That is updating the database with user/bot input.
   On the Call Center side, once they are in the conversation with the user, they can read the transcript built from the user's interaction with the bot.
   This is a simplistic example only saving the text of the conversation. In production, consider using the gzip option of the framework and parsing more details.

3. I call this this Lurking bot. Whenever a user starts a conversation, their messages are sent to the Call Center and the Call Center then has the option to do nothing
   or enter text that is then passed to the user. This integrates the customer service/help functionality with the rest of the bot.



*PRO TIP* Use caution when identifying a bot with a conversationId. That can seem stable but it does change.
