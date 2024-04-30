import { VBoxLayout, useWindowDimensions } from "@fi-sci/misc";
import { FunctionComponent, useEffect, useState } from "react";
import ApplicationBar, { applicationBarHeight } from "./ApplicationBar";
import HomePage from "./pages/HomePage/HomePage";
import useRoute from "./useRoute";

type Props = {
    // none
}

const MainWindow: FunctionComponent<Props> = () => {
    const {width, height} = useWindowDimensions()
    const H1 = applicationBarHeight
    const H2 = height - applicationBarHeight
    const [contextTitle, setContextTitle] = useState<string | undefined>(undefined)
    return (
        <VBoxLayout
            width={width}
            heights={[H1, H2]}
        >
            <ApplicationBar
                contextTitle={contextTitle}
            />
            <MainContent
                width={0} // filled in by VBoxLayout
                height={0} // filled in by VBoxLayout
                onContextTitle={setContextTitle}
            />
        </VBoxLayout>
    )
}

type MainContentProps = {
    width: number
    height: number
    onContextTitle: (contextTitle: string | undefined) => void
}

const MainContent: FunctionComponent<MainContentProps> = ({width, height, onContextTitle}) => {
    const {route} = useRoute()
    useEffect(() => {
        onContextTitle('')
    }, [onContextTitle])
    return (
        route.page === 'home' ? (
            <HomePage width={width} height={height} />
        ) : (
            <div>404</div>
        )
    )
}

export default MainWindow