/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useEffect, useMemo, useState } from "react"
import useSpyndle from "../../SpyndleContext/useSpyndle"
import { DataForNwbFile } from "../../SpyndleClient/SpyndleClient"

type SessionViewProps = {
    width: number
    height: number
    nwbFileName: string
}

type SelectedRows = {
    tableName: string
    rowIndex: number
}[]

type PrimaryKeyFilter = {
    [key: string]: string
} | undefined

const SessionView: FunctionComponent<SessionViewProps> = ({ width, height, nwbFileName }) => {
    const {spyndleClient} = useSpyndle()
    const [dataForNwbFile, setDataForNwbFile] = useState<DataForNwbFile>()
    const [selectedRows, setSelectedRows] = useState<SelectedRows>([])
    useEffect(() => {
        if (!nwbFileName) return
        let canceled = false
        setDataForNwbFile(undefined)
        if (!spyndleClient) return
        spyndleClient.requestDataForNwbFile(nwbFileName).then(d => {
            if (canceled) return
            setDataForNwbFile(d)
        })
        return () => {canceled = true}
    }, [nwbFileName, spyndleClient])
    const primaryKeyFilter = useMemo(() => {
        if (selectedRows.length === 0) return undefined
        if (!dataForNwbFile) return undefined
        const f: PrimaryKeyFilter = {}
        selectedRows.forEach(r => {
            const table = dataForNwbFile.tables.find(t => t.table_name === r.tableName)
            if (!table) return
            table.primary_key.forEach(k => {
                const val = table.rows[r.rowIndex][k]
                if (val === undefined) return
                f[k] = `${val}`
            })
        })
        return f
    }, [selectedRows, dataForNwbFile])
    const sortedTables = useMemo(() => (
        dataForNwbFile ? dataForNwbFile.tables.sort((a, b) => {
            const roleA = getDatajointTableTier(a.table_name)
            const roleB = getDatajointTableTier(b.table_name)
            const displayNameA = getDisplayTableName(a.table_name).toLowerCase()
            const displayNameB = getDisplayTableName(b.table_name).toLowerCase()
            const roleOrder = {manual: 1, imported: 2, computed: 3, lookup: 4, job: 5}
            if (roleA !== roleB) {
                return roleOrder[roleA] - roleOrder[roleB]
            }
            return displayNameA < displayNameB ? -1 : 1
        }) : []
    ), [dataForNwbFile])
    if (!spyndleClient) {
        return <div>spyndleClient not available</div>
    }
    if (!nwbFileName) {
        return <div>No session selected</div>
    }
    if (!dataForNwbFile) {
        return <div>Loading...</div>
    }
    return (
        <div style={{ position: 'absolute', width, height, overflowY: 'auto', fontSize: 12 }}>
            <div style={{fontWeight: 'bold', fontSize: 18}}>{nwbFileName}</div>
            {
                sortedTables.map((table, i) => {
                    return (
                        <TableView
                            key={i}
                            table={table}
                            visibleRows={
                                primaryKeyFilter ? table.rows.map((row) => {
                                    for (const key in primaryKeyFilter) {
                                        if (`${row[key]}` !== primaryKeyFilter[key]) return false
                                    }
                                    return true
                                }) : undefined
                            }
                            selectedRowIndices={selectedRows.filter(r => r.tableName === table.table_name).map(r => r.rowIndex)}
                            setSelectedRowIndices={(rowIndices) => {
                                setSelectedRows(selectedRows.filter(r => r.tableName !== table.table_name).concat(rowIndices.map(rowIndex => ({tableName: table.table_name, rowIndex}))))
                            }}
                        />
                    )
                })
            }
        </div>
    )
}

type TableViewProps = {
    table: DataForNwbFile['tables'][0]
    selectedRowIndices: number[]
    setSelectedRowIndices: (rowIndices: number[]) => void
    visibleRows?: boolean[]
}

const TableView: FunctionComponent<TableViewProps> = ({ table, selectedRowIndices, setSelectedRowIndices, visibleRows }) => {
    const [expanded, setExpanded] = useState(false)
    const numVisible = visibleRows ? visibleRows.filter(v => v).length : table.rows.length
    return (
        <div>
            <div style={{
                fontWeight: numVisible > 0 ? 'bold' : 'normal',
                textDecoration: numVisible === 0 ? 'line-through' : 'none',
                fontSize: 14,
                paddingTop: 8,
                paddingBottom: 2,
                color: colorForRole(getDatajointTableTier(table.table_name))
            }}>
                <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                    {expanded ? '-' : '+'}
                </button>
                <span style={{cursor: 'pointer'}} onClick={() => setExpanded(!expanded)}>
                    &nbsp;&nbsp;
                </span>
                <TableNameView name={table.table_name} onClick={() => setExpanded(!expanded)} rowCount={numVisible} />
            </div>
            {expanded ? (
                <div style={{maxHeight: 250, overflowY: 'auto'}}>
                    <table className="nwb-table">
                        <thead>
                            <tr>
                                <th />
                                {
                                    table.columns.map((column, i) => {
                                        return (
                                            <th key={i} style={table.primary_key.includes(column.name) ? {fontWeight: 'bold', color: 'white', textDecoration: 'underline'} : {fontWeight: 'bold', color: '#ddd'}}>{column.name}</th>
                                        )
                                    })
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {
                                table.rows.map((row, i) => {
                                    if (visibleRows && !visibleRows[i]) return null
                                    return (
                                        <TableRow
                                            key={i}
                                            primaryKey={table.primary_key}
                                            columns={table.columns}
                                            row={row}
                                            selected={selectedRowIndices.includes(i)}
                                            setSelected={selected => {
                                                if (selected) {
                                                    setSelectedRowIndices([...selectedRowIndices.filter(j => j !== i), i])
                                                }
                                                else {
                                                    setSelectedRowIndices(selectedRowIndices.filter(j => j !== i))
                                                }
                                            }}
                                        />
                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}

type TableRowProps = {
    columns: DataForNwbFile['tables'][0]['columns']
    primaryKey: string[]
    row: {[key: string]: any}
    selected: boolean
    setSelected: (selected: boolean) => void
}

const TableRow: FunctionComponent<TableRowProps> = ({ columns, row, primaryKey, selected, setSelected }) => {
    return (
        <tr>
            <td>
                <input type="checkbox" checked={selected} onChange={e => setSelected(e.target.checked)} />
            </td>
            {
                columns.map((column, i) => {
                    return (
                        <td key={i} style={primaryKey.includes(column.name) ? {fontWeight: 'bold'} : {fontWeight: 'normal'}}>
                            {`${row[column.name]}`}
                        </td>
                    )
                })
            }
        </tr>
    )
}

type TableNameViewProps = {
    name: string
    onClick?: () => void
    rowCount?: number
}

const TableNameView: FunctionComponent<TableNameViewProps> = ({ name, onClick, rowCount }) => {
    const name2 = getDisplayTableName(name)
    const role = getDatajointTableTier(name)
    return (
        <span style={{cursor: onClick ? 'pointer' : 'default'}} onClick={onClick}>
            {name2} { rowCount ? `(${rowCount})` : '' } - {role}
        </span>
    )

}

const getDisplayTableName = (name: string) => {
    const a = name.split('.')[1] || ''
    const b = a.replace(/`/g, '')
    // remove prefix of _ or __ or ~ or #
    const c = b.replace(/^[#_~]+/, '')
    return snakeCaseToCamelCase(c)
}

const snakeCaseToCamelCase = (s: string) => {
    // camel case and first letter should be capital
    return s.replace(/_./g, m => m[1].toUpperCase()).replace(/^./, m => m.toUpperCase())
}

const getDatajointTableTier = (name: string) => {
    const a = name.split('.')[1] || ''
    const b = a.replace(/`/g, '')
    if (b.startsWith('#')) {
        return 'lookup'
    }
    else if (b.startsWith('__')) {
        return 'computed'
    }
    else if (b.startsWith('_')) {
        return 'imported'
    }
    else if (b.startsWith('~')) {
        return 'job'
    }
    else {
        return 'manual'
    }
}

const colorForRole = (role: string) => {
    switch (role) {
        case 'manual':
            return 'black'
        case 'imported':
            return 'blue'
        case 'computed':
            return 'green'
        case 'lookup':
            return 'purple'
        case 'job':
            return 'orange'
    }
}

export default SessionView