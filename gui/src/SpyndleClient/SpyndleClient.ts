/* eslint-disable @typescript-eslint/no-explicit-any */
class SpyndleClient {
    #cachedData: {[nwbFileName: string]: DataForNwbFile} = {};
    constructor(private o: {_nwbFilenames: string[]}) {

    }
    static async create() {
        const url = 'https://neurosift.org/spyndle/franklab/nwb_file_names.json'
        const response = await fetch(url);
        if (response.ok) {
            const nwbFileNames = await response.json();
            return new SpyndleClient({_nwbFilenames: nwbFileNames})
        }
        else {
            alert('Failed to fetch NWB file names from ' + url);
        }
    }
    get nwbFilenames() {
        return [...this.o._nwbFilenames];
    }
    async requestDataForNwbFile(nwbFileName: string) {
        if (this.#cachedData[nwbFileName]) {
            return this.#cachedData[nwbFileName];
        }
        const url = `https://neurosift.org/spyndle/franklab/sessions/${nwbFileName}.json`
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            this.#cachedData[nwbFileName] = data;
            return data;
        }
        else {
            return undefined
        }
    }
}

export type DataForNwbFile = {
    tables: {
        table_name: string
        primary_key: string[]
        columns: {
            name: string
            type: string
        }[]
        rows: {[key: string]: any}[]
    }[]
}

export default SpyndleClient;