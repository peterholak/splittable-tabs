import * as React from 'react'
import * as PropTypes from 'prop-types'

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
    children?: React.ReactNode
}

export interface State {
    zones: Zone[]
}

export class SplittableTabs extends React.Component<Props, State> {

    state: State = { zones: [] }

    componentWillMount() {
        this.recalculateZones(this.props)
    }

    componentWillReceiveProps(nextProps: Props) {
        this.recalculateZones(nextProps)
    }

    render() {
        
        const tabsByKey = this.getTabsByKey()
        return <div>
            <h1>Zones</h1>
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
        const contents = tabsByKey[zone.activeKey].children
        return <div key={index}>
            <h2>Zone {index}</h2>
            <div>{tabs}</div>
            <div>{contents}</div>
        </div>
    }

    renderTab(title: string, zone: Zone, zoneIndex: number, key: TabKey) {

        const style = (key === zone.activeKey ?
            { ...styles.tab, ...styles.activeTab } :
            styles.tab
        )

        let operations: JSX.Element|undefined = undefined
        if (zone.tabs.length > 1) {
            operations = <span
                style={styles.split}
                onClick={e => { this.onSplitClicked(zoneIndex, key); e.stopPropagation() }}
                >
                S
            </span>
        }else if (zoneIndex > 0) {
            operations = <span
                style={styles.split}
                onClick={e => { this.onMergeClicked(zoneIndex, key); e.stopPropagation() }}
                >
                M0
            </span>
        }

        return <div key={key} style={style} onClick={() => this.onTabClicked(zoneIndex, key)}>
            {title} {operations}
        </div>

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

    onTabClicked(zoneIndex: number, key: TabKey) {
        const nextZones = [ ...this.state.zones ]
        const zone = this.state.zones[zoneIndex]
        nextZones[zoneIndex] = {
            activeKey: key,
            tabs: zone.tabs,
            sizePercent: zone.sizePercent
        }
        this.setState({ zones: nextZones })
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

    onMergeClicked(zoneIndex: number, key: TabKey) {
        const oldZone = this.state.zones[zoneIndex]
        const zone0 = this.state.zones[0]
        const removingOldZone = oldZone.tabs.length === 1

        const nextZones = this.state.zones.filter(z =>
            !removingOldZone || z !== oldZone
        )

        nextZones[0] = {
            activeKey: zone0.activeKey,
            tabs: [ ...zone0.tabs, key ],
            sizePercent: zone0.sizePercent + (removingOldZone ? oldZone.sizePercent : 0)
        }

        if (!removingOldZone) {
            nextZones[zoneIndex] = {
                activeKey: this.activeKeyAfterTabRemoval(oldZone.tabs, oldZone.activeKey, key),
                tabs: oldZone.tabs.filter(k => k !== key),
                sizePercent: oldZone.sizePercent
            }
        }

        this.setState({ zones: nextZones })
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
        cursor: 'pointer'
    },

    activeTab: {
        border: '1px solid #000',
        borderBottom: 'none'
    },

    split: {
        textDecoration: 'underline',
        color: "#00f"
    }
}
