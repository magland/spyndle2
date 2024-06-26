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

type Item = {
    type: 'table'
    table: DataForNwbFile['tables'][0]
} | {
    type: 'schema-header'
    schemaName: string
} | {
    type: 'divider'
}

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
            const roleA = getDatajointTableRole(a.table_name)
            const roleB = getDatajointTableRole(b.table_name)
            const displayNameA = getDisplayTableName(a.table_name).toLowerCase()
            const displayNameB = getDisplayTableName(b.table_name).toLowerCase()
            const roleOrder = {manual: 1, imported: 2, computed: 3, lookup: 4, job: 5}
            if (roleA !== roleB) {
                return roleOrder[roleA] - roleOrder[roleB]
            }
            return displayNameA < displayNameB ? -1 : 1
        }) : []
    ), [dataForNwbFile])
    const items = useMemo(() => {
        const items: Item[] = []
        const allSchemaNames: string[] = []
        sortedTables.forEach(t => {
            const schemaName = t.table_name.split('.')[0].replace(/`/g, '')
            if (!allSchemaNames.includes(schemaName)) {
                allSchemaNames.push(schemaName)
            }
        })
        allSchemaNames.sort()
        let lastSchemaPrefix = ''
        for (const schemaName of allSchemaNames) {
            const tablesForSchema = sortedTables.filter(t => t.table_name.split('.')[0].replace(/`/g, '') === schemaName)
            if (tablesForSchema.length === 0) continue
            const schemaPrefix = schemaName.split('_')[0]
            if (schemaPrefix !== lastSchemaPrefix) {
                items.push({type: 'divider'})
                lastSchemaPrefix = schemaPrefix
            }
            items.push({type: 'schema-header', schemaName})
            tablesForSchema.forEach(t => {
                items.push({type: 'table', table: t})
            })
        }
        return items
    }, [sortedTables])
    const {nwbFileUrl, nwbFileDescription} = useMemo(() => {
        if (!sortedTables) return {nwbFileUrl: undefined, nwbFileDescription: undefined}
        const nwbFileTable = sortedTables.find(t => t.table_name === '`common_nwbfile`.`nwbfile`')
        if (!nwbFileTable) return {nwbFileUrl: undefined, nwbFileDescription: undefined}
        const nwbFileRow = nwbFileTable.rows[0]
        if (!nwbFileRow) return {nwbFileUrl: undefined, nwbFileDescription: undefined}
        return {nwbFileUrl: nwbFileRow['nwb_file_url'], nwbFileDescription: nwbFileRow['nwb_file_description']}
    }, [sortedTables])
    const neurosiftUrl = useMemo(() => {
        if (!nwbFileUrl) return undefined
        const st = nwbFileName.endsWith('.lindi.json') ? '&st=lindi' : ''
        return `https://neurosift.app/?p=/nwb&url=${nwbFileUrl}${st}`
    }, [nwbFileUrl, nwbFileName])
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
            <div style={{fontWeight: 'bold', fontSize: 18}}>
                {nwbFileName}
            </div>
            {nwbFileDescription && <div style={{fontWeight: 'bold', fontSize: 18, paddingTop: 8}}>
                {nwbFileDescription}
            </div>}
            {neurosiftUrl && <div style={{paddingTop: 8}}>
                <a href={neurosiftUrl} target="_blank" rel="noreferrer">Open in NeuroSift</a>
            </div>}
            {
                items.map((item, i) => {
                    if (item.type === 'schema-header') {
                        return (
                            <div key={i} style={{paddingTop: 8, paddingBottom: 2, fontSize: 14, color: '#555', fontWeight: 'bold'}}>
                                {item.schemaName}&nbsp;&nbsp;
                            </div>
                        )
                    }
                    else if (item.type === 'table') {
                        return (
                            <TableView
                                key={i}
                                table={item.table}
                                visibleRows={
                                    primaryKeyFilter ? item.table.rows.map((row) => {
                                        for (const key in primaryKeyFilter) {
                                            if ((key in row) && (`${row[key]}` !== primaryKeyFilter[key])) return false
                                        }
                                        return true
                                    }) : undefined
                                }
                                selectedRowIndices={selectedRows.filter(r => r.tableName === item.table.table_name).map(r => r.rowIndex)}
                                setSelectedRowIndices={(rowIndices) => {
                                    setSelectedRows(selectedRows.filter(r => r.tableName !== item.table.table_name).concat(rowIndices.map(rowIndex => ({tableName: item.table.table_name, rowIndex}))))
                                }}
                            />
                        )
                    }
                    else if (item.type === 'divider') {
                        return (
                            <div key={i} style={{paddingTop: 16, paddingBottom: 4, borderBottom: '1px solid #888'}} />
                        )
                    }
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
    if (numVisible === 0) return null
    return (
        <div>
            <div style={{
                fontWeight: numVisible > 0 ? 'bold' : 'normal',
                // textDecoration: numVisible === 0 ? 'line-through' : 'none',
                fontSize: 14,
                paddingTop: 8,
                paddingBottom: 2,
                color: colorForRole(getDatajointTableRole(table.table_name))
            }}>
                <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                    {expanded ? '-' : '+'}
                </button>
                <span style={{cursor: 'pointer'}} onClick={() => setExpanded(!expanded)}>
                    &nbsp;&nbsp;
                </span>
                <TableNameView table={table} onClick={() => setExpanded(!expanded)} rowCount={numVisible} />
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
    table: DataForNwbFile['tables'][0]
    onClick?: () => void
    rowCount?: number
}

const TableNameView: FunctionComponent<TableNameViewProps> = ({ table, onClick, rowCount }) => {
    const name2 = getDisplayTableName(table.table_name)
    // const role = getDatajointTableRole(table.table_name)
    return (
        <span style={{cursor: onClick ? 'pointer' : 'default'}} onClick={onClick}>
            {name2} { rowCount ? `(${rowCount})` : '' }
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

const getDatajointTableRole = (name: string) => {
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