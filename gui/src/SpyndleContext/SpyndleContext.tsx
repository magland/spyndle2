import React, { FunctionComponent, PropsWithChildren, useEffect, useMemo } from 'react';
import SpyndleClient from '../SpyndleClient/SpyndleClient';

const urlQuery = new URLSearchParams(window.location.search)
const instance = urlQuery.get('i') || 'franklab'

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
            const client = await SpyndleClient.create(instance)
            if (!client) return
            spyndleStateDispatch({
                type: 'setSpyndleClient',
                spyndleClient: client
            })
        })()
    }, [])

    useEffect(() => {
        // set s query parameter in url each time currentNwbFileName changes
        if (!spyndleState.currentNwbFileName) return
        const url = new URL(window.location.href)
        url.searchParams.set('s', spyndleState.currentNwbFileName)
        window.history.replaceState({}, '', url.toString())
    }, [spyndleState.currentNwbFileName])

    useEffect(() => {
        // check the initial s query parameter in url
        const url = new URL(window.location.href)
        const s = url.searchParams.get('s')
        if (s) {
            spyndleStateDispatch({
                type: 'setCurrentNwbFileName',
                nwbFileName: s
            })
        }
    }, [])

    return (
        <SpyndleContext.Provider value={value}>
            {children}
        </SpyndleContext.Provider>
    )
}