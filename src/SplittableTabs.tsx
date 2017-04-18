import * as React from 'react'
import { TabKey, TabsByKey, TabProps, Zone, Zones } from './Zones'
import { XY, XY0, MouseInteraction, MouseInteractions, ZoneTabAreas, TabElements } from './MouseInteraction'
import styles from './styles'

export const Tab = (props: TabProps) => <div />

export interface Props {
    children?: React.ReactNode,
    style?: React.CSSProperties
}

export interface State {
    zones: Zones,
    mouse: MouseInteractions
}

export class SplittableTabs extends React.Component<Props, State> {

    state: State = {
        zones: new Zones(),
        mouse: new MouseInteractions()
    }
    zoneTabArea: ZoneTabAreas = {}
    tabElements: TabElements = {}

    componentWillMount() {
        const tabsByKey = this.getTabsByKey(this.props.children)
        this.setState({ zones: this.state.zones.recalculate(tabsByKey) })
    }

    componentWillReceiveProps(nextProps: Props) {
        const tabsByKey = this.getTabsByKey(nextProps.children)
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

    renderZone(tabsByKey: TabsByKey, zone: Zone, zoneIndex: number) {
        const tabs = zone.tabs.map((key, position) => {
            const [ before, after ] = this.renderDropAreas(zoneIndex, zone, position, key)
            return [ before, this.renderTab(tabsByKey[key].title, zone, zoneIndex, key), after ]
        })
        const style = { ...styles.borders, ...styles.zone, flexGrow: zone.sizePercent }
        const tabBarStyle = {
            ...styles.borders,
            ...(this.state.mouse.data.tabOverZone === zoneIndex ? styles.hoverZone : undefined)
        }
        const contents = tabsByKey[zone.activeKey].children
        return <div key={zoneIndex} style={style}>
            <h3>Zone {zoneIndex}</h3>
            <div ref={area => area ? this.zoneTabArea[zoneIndex] = area : delete this.zoneTabArea[zoneIndex]} style={tabBarStyle}>
                {tabs}
            </div>
            <div style={styles.borders}>{contents}</div>
        </div>
    }

    renderDropAreas(
        zoneIndex: number,
        zone: Zone,
        tabPosition: number,
        tabKey: TabKey
    ): [ JSX.Element|undefined, JSX.Element|undefined ] {

        const mouse = this.state.mouse.data
        if (!mouse.dragging || zoneIndex !== mouse.tabOverZone || mouse.hoverPosition === undefined) {
            return [ undefined, undefined ]
        }

        let before: JSX.Element|undefined, after: JSX.Element|undefined
        const zones = this.state.zones

        const tabFromSameZone = zones.indexForTab(mouse.tabDown!) === zoneIndex
        let selfPositionOffset = 0, skipHighlight = false
        if (tabFromSameZone) {
            const draggedPosition = zones.positionOfTab(zoneIndex, mouse.tabDown!)
            selfPositionOffset = (tabPosition >= draggedPosition ? 1 : 0)
        }

        if (tabPosition === mouse.hoverPosition + selfPositionOffset && tabKey !== mouse.tabDown) {
            const draggedTabRect = this.tabElements[mouse.tabDown!].getBoundingClientRect()
            before = <div style={{ ...styles.dropArea, width: draggedTabRect.width, height: draggedTabRect.height }} />
        }
        if (tabPosition === zone.tabs.length - 1 && mouse.hoverPosition === zone.tabs.length - selfPositionOffset) {
            const draggedTabRect = this.tabElements[mouse.tabDown!].getBoundingClientRect()
            after = <div style={{ ...styles.dropArea, width: draggedTabRect.width, height: draggedTabRect.height }} />
        }

        return [ before, after ]
    }

    renderTab(title: string, zone: Zone, zoneIndex: number, key: TabKey) {

        let style = (key === zone.activeKey ?
            { ...styles.tab, ...styles.activeTab } :
            styles.tab
        )

        if (this.state.mouse.isDraggingTab(key)) {
            const offset = this.state.mouse.data.offset
            style = {
                ...style,
                ...styles.pressedTab,
                position: 'absolute',
                left: offset.x + this.state.mouse.data.originalStart.x,
                top: offset.y + this.state.mouse.data.originalStart.y
            }
        }

        return <div
            ref={e => e ? this.tabElements[key] = e : delete this.tabElements[key]}
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

    onComponentMouseLeave() {
        this.setState({ mouse: new MouseInteractions() })
    }

    onComponentMouseMove(e: React.MouseEvent<any>) {
        this.setState({ mouse: this.state.mouse.move(
            e.clientX, e.clientY, this.zoneTabArea, this.tabElements, this.state.zones
        ) })
    }

    onComponentMouseUp() {
        if (this.state.mouse.data.tabOverZone !== undefined) {
            const zoneIndex = this.state.mouse.data.tabOverZone
            const position = this.state.mouse.data.hoverPosition!
            const tabKey = this.state.mouse.data.tabDown!
            this.setState({
                zones: this.state.zones.
                    mergeInto(zoneIndex, tabKey, position).
                    setActiveTab(tabKey)
            })
        }
        this.setState({ mouse: new MouseInteractions() })
    }

    onTabMouseDown(e: React.MouseEvent<any>, key: TabKey) {
        this.setState({
            zones: this.state.zones.setActiveTab(key),
            mouse: this.state.mouse.start(key, e.clientX, e.clientY, this.tabElements)
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
