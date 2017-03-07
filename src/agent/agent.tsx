import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Chat, User, DirectLineOptions } from 'botframework-webchat';

export const App = (props: {
        directLine: DirectLineOptions,
        user: User,
        bot: User
    }, container: HTMLElement) => {
    ReactDOM.render(React.createElement(Hello, props), container);
} 

const Hello = (props: {
    directLine: DirectLineOptions,
    user: User,
    bot: User
}) =>
    <Chat
        directLine={ props.directLine }
        user={ props.user }
        bot={ props.bot }
    />;