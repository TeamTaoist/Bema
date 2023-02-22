import React, {useReducer, useContext} from 'react';
import reducer from './reducer';
import INIT_STATE from './initState';


const InfoContext = React.createContext();


const initState = {...INIT_STATE};

const InfoContextProvider = (props) => {
    const [state, dispatch] = useReducer(reducer, initState);
    console.log("=====InfoContextProvider=====",state);

    return <InfoContext.Provider value={{state,dispatch}}>
        {props.children}
    </InfoContext.Provider>;
};

const useInfo = () => ({...useContext(InfoContext)});

export {InfoContextProvider, useInfo};
