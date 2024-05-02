import { FunctionComponent, useMemo, useState } from "react"
import useSpyndle from "../../SpyndleContext/useSpyndle"
import { FaSearch } from 'react-icons/fa'

type SessionsTableProps = {
    width: number
    height: number
}

const SessionsTable: FunctionComponent<SessionsTableProps> = ({ width, height }) => {
    const {nwbFileNames, currentNwbFileName, setCurrentNwbFileName} = useSpyndle()
    const [filteredNwbFileNames, setFilteredNwbFileNames] = useState<string[] | undefined>(undefined)
    const sortedNwbFileNames = useMemo(() => {
        const f = filteredNwbFileNames || nwbFileNames
        return f ? f.sort(
            (a, b) => {
                const A = a.toLowerCase()
                const B = b.toLowerCase()
                if (A < B) return -1
                if (A > B) return 1
                return 0
            }
        ) : []
    }, [filteredNwbFileNames, nwbFileNames])
    if (!nwbFileNames) return (<div>Loading sessions...</div>)
    return (
        <div style={{ position: 'absolute', width, height }}>
            <NwbFileNamesFilter nwbFileNames={nwbFileNames} setFilteredNwbFileNames={setFilteredNwbFileNames} />
            <div style={{height: 8}}>&nbsp;</div>
            <div style={{position: 'absolute', width, top: 35, height: height - 35, overflow: 'auto'}}>
                <table className="nwb-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Session</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedNwbFileNames.map(ff => (
                            <tr key={ff} style={{cursor: 'pointer'}}>
                                <td><Checkbox checked={ff === currentNwbFileName} onClick={() => {
                                    setCurrentNwbFileName(ff)
                                }} /></td>
                                <td onClick={() => setCurrentNwbFileName(ff)}>{getDisplayNameFromNwbFileName(ff)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const Checkbox: FunctionComponent<{checked: boolean, onClick: () => void}> = ({checked, onClick}) => {
    return (
        <input type="radio" checked={checked} onClick={onClick} />
    )
}

type NwbFileNamesFilterProps = {
    nwbFileNames: string[]
    setFilteredNwbFileNames: (filteredNwbFileNames: string[] | undefined) => void
}

const NwbFileNamesFilter: FunctionComponent<NwbFileNamesFilterProps> = ({nwbFileNames, setFilteredNwbFileNames}) => {
    return (
        <div>
            <FaSearch />&nbsp;&nbsp;
            <input type="text" style={{width: 100}} placeholder="Filter sessions..." onChange={e => {
                const filter = e.target.value
                if (filter === '') {
                    setFilteredNwbFileNames(undefined)
                } else {
                    setFilteredNwbFileNames(nwbFileNames?.filter(ff => ff.toLowerCase().includes(filter.toLowerCase())))
                }
            }} />
        </div>
    )
}

const getDisplayNameFromNwbFileName = (nwbFileName: string) => {
    if (nwbFileName.endsWith('_.nwb')) {
        return nwbFileName.slice(0, -'_.nwb'.length)
    }
    return nwbFileName
}


export default SessionsTable