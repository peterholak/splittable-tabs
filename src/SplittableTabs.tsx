import * as React from 'react'
import { TabKey, TabsByKey, TabProps, Zone, Zones } from './Zones'
import styles from './styles'

export const Tab = (props: TabProps) => <div />

export interface Props {
    children?: React.ReactNode,
    style?: React.CSSProperties
}

export interface XY { x: number, y: number }
const XY0 = { x: 0, y: 0 }

export interface MouseInteraction {
    tabDown: TabKey|undefined
    offset: XY
    touchStart: XY,
    tabOverZone?: number
}

export interface State {
    zones: Zones,
    mouse: MouseInteraction
}

export class SplittableTabs extends React.Component<Props, State> {

    state: State = {
        zones: new Zones(),
        mouse: { tabDown: undefined, offset: XY0, touchStart: XY0 }
    }
    zoneTabArea: {[index: number]: HTMLDivElement} = {}

    componentWillMount() {
        const tabsByKey = this.getTabsByKey(this.props.children)
        this.setState({ zones: this.state.zones.recalculate(tabsByKey) })
    }

    componentWillReceiveProps(nextProps: Props) {
        const tabsByKey = this.getTabsByKey(this.props.children)
        this.setState({ zones: this.state.zones.recalculate(tabsByKey)})
    }

    render() {
        
        const tabsByKey = this.getTabsByKey()
        return <div
            onMouseLeave={this.onComponentMouseLeave.bind(this)}
            onMouseMove={this.onComponentMouseMove.bind(this)}
            onMouseUp={this.onComponentMouseUp.bind(this)}
            style={{ ...styles.borders, ...styles.component, ...this.props.style }}
        >
            {this.state.zones.data.map((z, index) =>
                this.renderZone(tabsByKey, z, index))
            }
        </div>
    }

    renderZone(tabsByKey: TabsByKey, zone: Zone, index: number) {
        const tabs = zone.tabs.map(key => this.renderTab(
            tabsByKey[key].title,
            zone,
            index,
            key
        ))
        const style = { ...styles.borders, ...styles.zone, flexGrow: zone.sizePercent }
        const tabBarStyle = {
            ...styles.borders,
            ...(this.state.mouse.tabOverZone === index ? styles.hoverZone : undefined)
        }
        const contents = tabsByKey[zone.activeKey].children
        return <div key={index} style={style}>
            <h2>Zone {index}</h2>
            <div ref={area => this.zoneTabArea[index] = area} style={tabBarStyle}>{tabs}</div>
            <div style={styles.borders}>{contents}</div>
        </div>
    }

    renderTab(title: string, zone: Zone, zoneIndex: number, key: TabKey) {

        let style = (key === zone.activeKey ?
            { ...styles.tab, ...styles.activeTab } :
            styles.tab
        )

        if (this.state.mouse.tabDown === key) {
            const offset = this.state.mouse.offset
            style = { ...style, ...styles.pressedTab, position: 'relative', left: offset.x, top: offset.y }
        }

        return <div
            key={key}
            style={style}
            onMouseDown={(e) => this.onTabMouseDown(e, key)}
        >
            {title} {this.renderTabOperations(zone, zoneIndex, key)}
        </div>

    }

    renderTabOperations(zone: Zone, zoneIndex: number, key: TabKey) {
        if (zone.tabs.length > 1) {
            return <span
                style={styles.split}
                onClick={e => this.onSplitClicked(e, key)}
                >
                Split
            </span>
        }
        return undefined
    }

    resetTabDrag() {
        this.setState({ mouse: { tabDown: undefined, offset: XY0, touchStart: XY0 } })
    }

    onComponentMouseLeave() {
        this.resetTabDrag()
    }

    onComponentMouseMove(e: React.MouseEvent<any>) {
        if (this.state.mouse.tabDown === undefined) { return }

        let tabOverZone: number|undefined = undefined
        for (let i=0; i<this.state.zones.data.length; i++) {
            const rect = this.zoneTabArea[i].getBoundingClientRect()
            if (e.clientX > rect.left && e.clientY > rect.top && e.clientX < rect.right && e.clientY < rect.bottom) {
                tabOverZone = i
                break
            }
        }

        const start = this.state.mouse.touchStart
        this.setState({ mouse: {
            tabDown: this.state.mouse.tabDown,
            offset: { x: e.clientX - start.x, y: e.clientY - start.y },
            touchStart: start,
            tabOverZone
        }})
    }

    onComponentMouseUp() {
        if (this.state.mouse.tabDown === undefined) { return }

        if (this.state.mouse.tabOverZone !== undefined) {
            const zoneIndex = this.state.mouse.tabOverZone
            const tabKey = this.state.mouse.tabDown
            this.setState({
                zones: this.state.zones.
                    mergeInto(zoneIndex, tabKey).
                    setActiveTab(tabKey)
            })
        }
        return this.resetTabDrag()
    }

    onTabMouseDown(e: React.MouseEvent<any>, key: TabKey) {
        this.setState({
            zones: this.state.zones.setActiveTab(key),
            mouse: {
                tabDown: key,
                offset: this.state.mouse.offset,
                touchStart: { x: e.clientX, y: e.clientY }
            }
        })
        e.preventDefault()
    }

    onSplitClicked(e: React.MouseEvent<any>, key: TabKey) {
        this.setState({ zones: this.state.zones.splitOff(key) })
        e.stopPropagation()
    }

    getTabsByKey(children: React.ReactNode = this.props.children): TabsByKey {
        type SEL = React.ReactElement<TabProps>
        const sectionsByKey: TabsByKey = {}
        React.Children.
            forEach(children, child => {
                if ((child as SEL).type === Tab) {
                    sectionsByKey[(child as SEL).props.eventKey] = (child as SEL).props
                }
            })
        return sectionsByKey
    }
}
