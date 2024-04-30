import { useCallback, useContext, useMemo } from "react"
import { SpyndleContext } from "./SpyndleContext"

const useSpyndle = () => {
    const {spyndleState, spyndleStateDispatch} = useContext(SpyndleContext)

    const setCurrentNwbFileName = useCallback((nwbFileName: string) => {
        spyndleStateDispatch({
            type: 'setCurrentNwbFileName',
            nwbFileName
        })
    }, [spyndleStateDispatch])

    const spyndleClient = useMemo(() => {
        return spyndleState.spyndleClient
    }, [spyndleState.spyndleClient])

    const nwbFileNames = useMemo(() => {
        return spyndleClient?.nwbFilenames
    }, [spyndleClient])

    const currentNwbFileName = useMemo(() => {
        return spyndleState.currentNwbFileName
    }, [spyndleState.currentNwbFileName])

    return {
        spyndleClient,
        currentNwbFileName,
        setCurrentNwbFileName,
        nwbFileNames
    }
}

export default useSpyndle