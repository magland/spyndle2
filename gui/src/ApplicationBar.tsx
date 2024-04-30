import { SmallIconButton } from "@fi-sci/misc";
import { Help } from "@mui/icons-material";
import { AppBar, Toolbar } from "@mui/material";
import { FunctionComponent, useCallback } from "react";
import useRoute from "./useRoute";

type Props = {
    contextTitle?: string
}

export const applicationBarHeight = 45
export const applicationBarColor = '#009879'
export const applicationBarColorDarkened = '#645'

const ApplicationBar: FunctionComponent<Props> = ({ contextTitle }) => {
    const { setRoute } = useRoute()

    const onHome = useCallback(() => {
        setRoute({ page: 'home' })
    }, [setRoute])

    const onHelp = useCallback(() => {
        // window.open('https://flatironinstitute.github.io/dendro-docs/docs/intro', '_blank')
        alert('No docs yet.')
    }, [])

    return (
        <span>
            <AppBar position="static" style={{ height: applicationBarHeight - 10, color: 'black', background: applicationBarColor }}>
                <Toolbar style={{ minHeight: applicationBarHeight - 10 }}>
                    <img src="/spyndle.png" alt="logo" height={30} style={{ paddingBottom: 1, cursor: 'pointer' }} onClick={onHome} />
                    <div onClick={onHome} style={{ cursor: 'pointer', color: 'white' }}>
                        &nbsp;&nbsp;&nbsp;spyglass browser - please do not share outside of Simons Foundation and Frank lab
                        {
                            contextTitle && (
                                <span style={{ fontFamily: 'courier', color: 'purple' }}> - {contextTitle}</span>
                            )
                        }
                    </div>
                    <span style={{ marginLeft: 'auto' }} />
                    <span>
                        <SmallIconButton
                            icon={<Help />}
                            onClick={onHelp}
                            title={`View the documentation`}
                        />
                    </span>
                    &nbsp;&nbsp;
                </Toolbar>
            </AppBar>
        </span>
    )
}

export default ApplicationBar