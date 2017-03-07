import {createStore} from 'redux';

interface State {
    a: number
}

const reducer = (
    state: State = {
        a: 15
    },
    action
) => {
	switch (action.type) {
        default:
            return state;
    }
}

export const store = createStore(reducer, {});
