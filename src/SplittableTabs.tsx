import * as React from 'react'

export interface TabProps {
    title: string
    eventKey: TabKey
    children?: React.ReactNode
}

export interface Zone {
    activeKey: TabKey
    sizePercent: number
    tabs: TabKey[]
}

export const Tab = (props: TabProps) => <div />
export type TabKey = string|number
export type TabsByKey = {[key: string]: TabProps}

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
    zones: Zone[],
    mouse: MouseInteraction
}

export class SplittableTabs extends React.Component<Props, State> {

    state: State = {
        zones: [],
        mouse: { tabDown: undefined, offset: XY0, touchStart: XY0 }
    }
    zoneTabArea: {[index: number]: HTMLDivElement} = {}

    componentWillMount() {
        this.recalculateZones(this.props)
    }

    componentWillReceiveProps(nextProps: Props) {
        this.recalculateZones(nextProps)
    }

    render() {
        
        const tabsByKey = this.getTabsByKey()
        return <div
            onMouseLeave={this.onComponentMouseLeave.bind(this)}
            onMouseMove={this.onComponentMouseMove.bind(this)}
            onMouseUp={this.onComponentMouseUp.bind(this)}
            style={{ ...styles.borders, ...styles.component, ...this.props.style }}
        >
            {this.state.zones.map((z, index) =>
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
                onClick={e => { this.onSplitClicked(zoneIndex, key); e.stopPropagation() }}
                >
                Split
            </span>
        }
        return undefined
    }

    recalculateZones(nextProps: Props) {
        const tabsByKey = this.getTabsByKey(nextProps.children)

        const newTabs = this.tabsWithoutZones(Object.keys(tabsByKey))
        const nextZones: Zone[] = []

        this.state.zones.forEach((zone, index) => {
            // Tabs which no longer exist in nextProps.children will be filtered out
            const withoutDeadTabs = zone.tabs.filter(key => tabsByKey[key] !== undefined)

            // Add any new tabs (newly added to nextProps.children) to the first zone
            const addedTabs = (index === 0 ? newTabs : [])

            if (addedTabs.length === 0 && withoutDeadTabs.length === zone.tabs.length) {
                nextZones[index] = zone
            }else if (addedTabs.length + withoutDeadTabs.length > 0) {
                nextZones[index] = {
                    activeKey: zone.activeKey,
                    tabs: [...withoutDeadTabs, ...addedTabs],
                    sizePercent: zone.sizePercent
                }
            }
            // If there would be zero tabs in this zone, we just skip it (TODO: normalize sizePercent)
        })

        // If there were zero zones before, let's just create a new one with all the new tabs (if any)
        if (nextZones.length === 0 && newTabs.length > 0) {
            nextZones.push({ activeKey: newTabs[0], tabs: newTabs, sizePercent: 100 })
        }

        this.setState({ zones: nextZones })
    }

    setActiveTab(key: TabKey) {
        const zoneIndex = this.zoneIndexForTab(key)
        const nextZones = [ ...this.state.zones ]
        const zone = this.state.zones[zoneIndex]
        nextZones[zoneIndex] = {
            activeKey: key,
            tabs: zone.tabs,
            sizePercent: zone.sizePercent
        }
        this.setState({ zones: nextZones })
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
        for (let i=0; i<this.state.zones.length; i++) {
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
            this.mergeIntoZone(zoneIndex, tabKey, () => {
                this.setActiveTab(tabKey)
            })
        }
        return this.resetTabDrag()
    }

    onTabMouseDown(e: React.MouseEvent<any>, key: TabKey) {
        this.setActiveTab(key)
        this.setState({ mouse: {
            tabDown: key,
            offset: this.state.mouse.offset,
            touchStart: { x: e.clientX, y: e.clientY }
        } })
        e.preventDefault()
    }

    onSplitClicked(zoneIndex: number, key: TabKey) {
        const oldZone = this.state.zones[zoneIndex]
        const nextZones = [ ...this.state.zones ]

        nextZones[zoneIndex] = {
            activeKey: this.activeKeyAfterTabRemoval(oldZone.tabs, oldZone.activeKey, key),
            tabs: oldZone.tabs.filter(k => k !== key),
            sizePercent: oldZone.sizePercent / 2
        }
        const newZone: Zone = {
            activeKey: key,
            tabs: [ key ],
            sizePercent: oldZone.sizePercent / 2
        }
        nextZones.push(newZone)
        this.setState({ zones: nextZones })
    }

    mergeIntoZone(zoneIndex: number, key: TabKey, callback?: () => any) {
        const oldIndex = this.zoneIndexForTab(key)
        if (oldIndex === zoneIndex) { return }
        const oldZone = this.state.zones[oldIndex]
        const newZone = this.state.zones[zoneIndex]
        const removingOldZone = oldZone.tabs.length === 1

        const nextZones = this.state.zones.filter(z =>
            !removingOldZone || z !== oldZone
        )

        const newZoneIndex = zoneIndex - (removingOldZone && zoneIndex > oldIndex ? 1 : 0)

        nextZones[newZoneIndex] = {
            activeKey: newZone.activeKey,
            tabs: [ ...newZone.tabs, key ],
            sizePercent: newZone.sizePercent + (removingOldZone ? oldZone.sizePercent : 0)
        }

        if (!removingOldZone) {
            nextZones[oldIndex] = {
                activeKey: this.activeKeyAfterTabRemoval(oldZone.tabs, oldZone.activeKey, key),
                tabs: oldZone.tabs.filter(k => k !== key),
                sizePercent: oldZone.sizePercent
            }
        }

        this.setState({ zones: nextZones }, callback)
    }

    activeKeyAfterTabRemoval(previousTabs: TabKey[], activeKey: TabKey, removedKey: TabKey) {
        // TODO: make this work better (pick the closest previous tab, check for zero new tabs, etc.)
        if (activeKey === removedKey) {
            return removedKey === previousTabs[0] ? previousTabs[1] : previousTabs[0]
        }
        return activeKey
    }

    zoneIndexForTab(key: TabKey) {
        for (let i=0; i<this.state.zones.length; i++) {
            if (this.state.zones[i].tabs.indexOf(key) !== -1) {
                return i
            }
        }
        throw new Error("No zone contains a tab with key '" + key + "'")
    }

    tabsWithoutZones(tabKeys: TabKey[]): TabKey[] {
        return tabKeys.filter(
            key => this.state.zones.every(zone => zone.tabs.indexOf(key) === -1)
        )
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

const styles: {[key: string]: React.CSSProperties} = {
    tab: {
        display: 'inline-block',
        padding: '10px',
        cursor: 'pointer',
        userSelect: 'none'
    },

    pressedTab: {
        background: '#faa'
    },

    activeTab: {
        border: '1px solid #000',
        borderBottom: 'none'
    },

    split: {
        textDecoration: 'underline',
        color: "#00f"
    },

    borders: {
        border: '1px dotted #ccc'
    },

    component: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch'
    },

    zone: {
        
    },

    hoverZone: {
        background: '#cfc'
    }
}
