export type TabKey = string|number

export interface TabProps {
    title: string
    eventKey: TabKey
    children?: React.ReactNode
}

export type TabsByKey = {[key: string]: TabProps}

export interface Zone {
    activeKey: TabKey
    sizePercent: number
    tabs: TabKey[]
}

export const LastPosition = -1

/**
 * Performs the immutable updates to zones. The data here represents the "written" state of tabs and zones,
 * not taking into account any intermediate dragging and other UI interactions (see `MouseInteractions` for that).
 */
export class Zones {
    constructor(public data: Zone[] = []) { }

    /**
     * Deals with changes to the tab structure, most likely caused by updating the props
     * (when tabs may have been changed/added/removed/etc.).
     */
    recalculate(tabsByKey: TabsByKey): Zones {

        const newTabs = this.tabsWithoutZones(Object.keys(tabsByKey))
        const nextZones: Zone[] = []

        let anythingChanged = false

        this.data.forEach((zone, index) => {
            // Tabs which no longer exist in nextProps.children will be filtered out.
            const withoutDeadTabs = zone.tabs.filter(key => tabsByKey[key] !== undefined)

            // Add any new tabs (newly added to nextProps.children) to the first zone.
            const addedTabs = (index === 0 ? newTabs : [])

            if (addedTabs.length === 0 && withoutDeadTabs.length === zone.tabs.length) {
                nextZones[index] = zone
            }else if (addedTabs.length + withoutDeadTabs.length > 0) {
                anythingChanged = true
                nextZones[index] = {
                    activeKey: zone.activeKey,
                    tabs: [...withoutDeadTabs, ...addedTabs],
                    sizePercent: zone.sizePercent
                }
            }
            // If there would be zero tabs in this zone, we just skip it (TODO: normalize sizePercent).
        })

        // If there were zero zones before, let's just create a new one with all the new tabs (if any).
        if (nextZones.length === 0 && newTabs.length > 0) {
            anythingChanged = true;
            nextZones.push({ activeKey: newTabs[0], tabs: newTabs, sizePercent: 100 })
        }

        // TODO: test for the fact that the same object is returned when nothing has changed
        if (!anythingChanged) { return this }

        return new Zones(nextZones)
    }

    tabsWithoutZones(tabKeys: TabKey[]): TabKey[] {
        return tabKeys.filter(
            key => this.data.every(zone => zone.tabs.indexOf(key) === -1)
        )
    }

    /** Removes a tab from its zone and places it into a newly created zone at the end. */
    splitOff(key: TabKey): Zones {
        const oldIndex = this.indexForTab(key)
        const oldZone = this.data[oldIndex]
        const nextZones = [ ...this.data ]

        nextZones[oldIndex] = {
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
        return new Zones(nextZones)
    }

    /** Removes a tab from its zone and places it into the zone specified by `zoneIndex`. */
    mergeInto(zoneIndex: number, key: TabKey, position: number = LastPosition): Zones {
        const oldIndex = this.indexForTab(key)
        const oldZone = this.data[oldIndex]
        const newZone = this.data[zoneIndex]

        const realPosition = (position === LastPosition ?
            newZone.tabs.length :
            Math.min(position, newZone.tabs.length)
        )
        const oldPosition = this.positionOfTab(oldIndex, key)
        if (oldIndex === zoneIndex && oldPosition === realPosition) { return this }

        const removingOldZone = oldZone.tabs.length === 1
        const nextZones = this.data.filter(z => !removingOldZone || z !== oldZone)

        const newZoneIndex = zoneIndex - (removingOldZone && zoneIndex > oldIndex ? 1 : 0)

        const nextTabs = [ ...newZone.tabs ]
        if (oldZone === newZone) {
            nextTabs.splice(oldPosition, 1)
        }
        nextTabs.splice(realPosition, 0, key)

        nextZones[newZoneIndex] = {
            activeKey: newZone.activeKey,
            tabs: nextTabs,
            sizePercent: newZone.sizePercent + (removingOldZone ? oldZone.sizePercent : 0)
        }

        if (!removingOldZone && oldZone !== newZone) {
            nextZones[oldIndex] = {
                activeKey: this.activeKeyAfterTabRemoval(oldZone.tabs, oldZone.activeKey, key),
                tabs: oldZone.tabs.filter(k => k !== key),
                sizePercent: oldZone.sizePercent
            }
        }

        return new Zones(nextZones)
    }

    indexForTab(key: TabKey) {
        for (let i=0; i<this.data.length; i++) {
            if (this.data[i].tabs.indexOf(key) !== -1) {
                return i
            }
        }
        throw new Error(`No zone contains a tab with key '${key}'.`)
    }

    positionOfTab(zoneIndex: number, key: TabKey) {
        const result = this.data[zoneIndex].tabs.indexOf(key)
        if (result === -1) {
            throw new Error(`Zone ${zoneIndex} does not contain tab '${key}'.`)
        }
        return result
    }

    /** Returns the tab that should be activated when a previously active tab was removed from the zone. */
    activeKeyAfterTabRemoval(previousTabs: TabKey[], activeKey: TabKey, removedKey: TabKey) {
        // TODO: make this work better (pick the closest previous tab, check for zero new tabs, etc.).
        if (activeKey === removedKey) {
            return removedKey === previousTabs[0] ? previousTabs[1] : previousTabs[0]
        }
        return activeKey
    }

    setActiveTab(key: TabKey): Zones {
        const zoneIndex = this.indexForTab(key)
        const zone = this.data[zoneIndex]

        if (zone.activeKey === key) { return this }

        const nextZones = [ ...this.data ]
        nextZones[zoneIndex] = {
            activeKey: key,
            tabs: zone.tabs,
            sizePercent: zone.sizePercent
        }
        return new Zones(nextZones)
    }
}
