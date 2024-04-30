import React, { FunctionComponent, PropsWithChildren, useEffect, useMemo } from 'react';
import SpyndleClient from '../SpyndleClient/SpyndleClient';

type Props = {
    // none
}

type SpyndleState = {
    spyndleClient?: SpyndleClient
    currentNwbFileName: string
}

type SpyndleAction = {
    type: 'setCurrentNwbFileName'
    nwbFileName: string
} | {
    type: 'setSpyndleClient'
    spyndleClient: SpyndleClient

}

const spyndleReducer = (state: SpyndleState, action: SpyndleAction) => {
    switch (action.type) {
        case 'setCurrentNwbFileName':
            return {
                ...state,
                currentNwbFileName: action.nwbFileName
            }
        case 'setSpyndleClient':
            return {
                ...state,
                spyndleClient: action.spyndleClient
            }
        default:
            return state
    }
}

type SpyndleContextType = {
    spyndleState: SpyndleState
    spyndleStateDispatch: React.Dispatch<SpyndleAction>
}

export const SpyndleContext = React.createContext<SpyndleContextType>({
    spyndleState: {
        currentNwbFileName: ''
    },
    spyndleStateDispatch: () => {}
})

export const SetupSpyndle: FunctionComponent<PropsWithChildren<Props>> = ({children}) => {
    const [spyndleState, spyndleStateDispatch] = React.useReducer(spyndleReducer, {
        currentNwbFileName: ''
    })

    const value = useMemo(() => ({
        spyndleState,
        spyndleStateDispatch
    }), [spyndleState, spyndleStateDispatch])

    useEffect(() => {
        (async () => {
            const client = await SpyndleClient.create()
            if (!client) return
            spyndleStateDispatch({
                type: 'setSpyndleClient',
                spyndleClient: client
            })
        })()
    }, [])

    return (
        <SpyndleContext.Provider value={value}>
            {children}
        </SpyndleContext.Provider>
    )
}