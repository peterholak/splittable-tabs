import * as React from 'react'
import { TabKey, TabsByKey, TabProps, Zone, Zones } from './Zones'
import { XY, XY0, MouseInteraction, MouseInteractions, ZoneTabAreas, TabElements } from './MouseInteraction'
import styles from './styles'

export const Tab = (props: TabProps) => <div />

export interface Props {
    children?: React.ReactNode
    style?: React.CSSProperties
    zones?: Zones
    debugColor?: string
    onRecalculated?: ZoneListener
    onTabChanged?: TabListener
    onTabSplitOff?: TabListener
    onTabRepositioned?: TabListener
    onAnyZoneChange?: ZoneListener
}

export interface State {
    zones: Zones
    mouse: MouseInteractions
}

export type ZoneListener = (newZones: Zones) => void
export type TabListener = (tabKey: TabKey, newZones: Zones) => void

export class SplittableTabs extends React.Component<Props, State> {

    state: State = {
        zones: new Zones(),
        mouse: new MouseInteractions()
    }
    zoneTabArea: ZoneTabAreas = {}
    tabElements: TabElements = {}

    componentWillMount() {
        const tabsByKey = this.getTabsByKey(this.props.children)
        const newZones = this.zones().recalculate(tabsByKey)

        if (this.zones() === newZones) { return }

        if (!this.isControlled()) {
            this.setState({ zones: newZones })
        }
        this.props.onRecalculated && this.props.onRecalculated(newZones)
        this.props.onAnyZoneChange && this.props.onAnyZoneChange(newZones)
    }

    componentWillReceiveProps(nextProps: Props) {
        if (
            this.props.zones === nextProps.zones &&
            this.props.children === nextProps.children
        ) {
            return
        }

        const tabsByKey = this.getTabsByKey(nextProps.children)
        const newZones = this.zones().recalculate(tabsByKey)

        if (this.zones() === newZones) { return }

        if (!this.isControlled()) {
            this.setState({ zones: newZones })
        }
        this.props.onRecalculated && this.props.onRecalculated(newZones)
        this.props.onAnyZoneChange && this.props.onAnyZoneChange(newZones)
    }

    render() {
        
        const tabsByKey = this.getTabsByKey()
        return <div
            onMouseLeave={this.onComponentMouseLeave.bind(this)}
            onMouseMove={this.onComponentMouseMove.bind(this)}
            onMouseUp={this.onComponentMouseUp.bind(this)}
            onTouchMove={this.onComponentTouchMove.bind(this)}
            onTouchEnd={this.onComponentTouchEnd.bind(this)}
            onTouchCancel={this.onComponentTouchEnd.bind(this)}
            style={{ ...this.debugBorders(), ...styles.component, ...this.props.style }}
        >
            {this.zones().data.map((z, index) =>
                this.renderZone(tabsByKey, z, index))
            }
        </div>
    }

    renderZone(tabsByKey: TabsByKey, zone: Zone, zoneIndex: number) {
        const tabs = zone.tabs.map((key, position) => {
            const [ before, after ] = this.renderDropAreas(zoneIndex, zone, position, key)
            return [ before, this.renderTab(tabsByKey[key].title, zone, zoneIndex, key), after ]
        })
        const style = { ...this.debugBorders(), ...styles.zone, flexGrow: zone.sizePercent }
        const tabBarStyle = {
            ...this.debugBorders(),
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
        const zones = this.zones()

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
            onTouchStart={(e) => this.onTabTouchStart(e, key)}
            onTouchMove={e => e.preventDefault()} // prevents pull-to-refresh among other things
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
            e.clientX, e.clientY, this.zoneTabArea, this.tabElements, this.zones()
        ) })
    }

    onComponentTouchMove(e: React.TouchEvent<any>) {
        const touch = e.touches.item(0)
        this.setState({
            mouse: this.state.mouse.move(
                touch.clientX, touch.clientY, this.zoneTabArea, this.tabElements, this.zones()
            )
        })
    }

    onComponentMouseUp() {
        if (this.state.mouse.data.tabOverZone !== undefined) {
            const zoneIndex = this.state.mouse.data.tabOverZone
            const position = this.state.mouse.data.hoverPosition!
            const tabKey = this.state.mouse.data.tabDown!
            
            const newZones = this.zones().
                mergeInto(zoneIndex, tabKey, position).
                setActiveTab(tabKey)

            if (newZones !== this.zones()) {
                if (!this.isControlled()) {
                    this.setState({ zones: newZones })
                }
                this.props.onTabRepositioned && this.props.onTabRepositioned(tabKey, newZones)
                this.props.onAnyZoneChange && this.props.onAnyZoneChange(newZones)
            }
        }
        this.setState({ mouse: new MouseInteractions() })
    }

    onComponentTouchEnd() {
        this.onComponentMouseUp()
    }

    onTabMouseDown(e: React.MouseEvent<any>, key: TabKey) {
        const newZones = this.zones().setActiveTab(key)

        if (newZones !== this.zones()) {
            if (!this.isControlled()) {
                this.setState({ zones: newZones })
            }
            this.props.onTabChanged && this.props.onTabChanged(key, newZones)
            this.props.onAnyZoneChange && this.props.onAnyZoneChange(newZones)
        }

        this.setState({ mouse: this.state.mouse.start(key, e.clientX, e.clientY, this.tabElements) })
        e.preventDefault()
    }

    onTabTouchStart(e: React.TouchEvent<any>, key: TabKey) {
        const touch = e.targetTouches.item(0)
        const newZones = this.zones().setActiveTab(key)

        if (newZones !== this.zones()) {
            if (!this.isControlled()) {
                this.setState({ zones: newZones })
            }
            this.props.onTabChanged && this.props.onTabChanged(key, newZones)
            this.props.onAnyZoneChange && this.props.onAnyZoneChange(newZones)
        }
        
        this.setState({ mouse: this.state.mouse.start(key, touch.clientX, touch.clientY, this.tabElements) })
        e.preventDefault()
    }

    onSplitClicked(e: React.MouseEvent<any>, key: TabKey) {
        const newZones = this.zones().splitOff(key)

        if (!this.isControlled()) {
            this.setState({ zones: newZones })
        }
        this.props.onTabSplitOff && this.props.onTabSplitOff(key, newZones)
        this.props.onAnyZoneChange && this.props.onAnyZoneChange(newZones)

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

    isControlled() {
        return this.props.zones !== undefined
    }

    zones() { 
        return this.props.zones || this.state.zones
    }

    debugBorders() { 
        return { border: '1px dotted ' + (this.props.debugColor || '#ccc') }
    }
}
