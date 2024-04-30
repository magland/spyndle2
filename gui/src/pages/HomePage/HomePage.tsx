import { Splitter } from "@fi-sci/splitter"
import { FunctionComponent } from "react"
import SessionsTable from "./SessionsTable"
import useSpyndle from "../../SpyndleContext/useSpyndle"
import SessionView from "./SessionView"

type HomePageProps = {
    width: number
    height: number
}

const HomePage: FunctionComponent<HomePageProps> = ({ width, height }) => {
    const {currentNwbFileName} = useSpyndle()
    const mh = 8
    const mv = 8
    return (
        <div style={{position: 'absolute', left: mh, top: mv, width: width - mh * 2, height: height - mv * 2, overflow: 'hidden'}}>
            <Splitter
                width={width - mh * 2}
                height={height - mv * 2}
                initialPosition={Math.min(300, width / 2)}
            >
                <SessionsTable
                    width={0}
                    height={0}
                />
                <SessionView
                    width={0}
                    height={0}
                    nwbFileName={currentNwbFileName}
                />
            </Splitter>
        </div>
    )
}

export default HomePage