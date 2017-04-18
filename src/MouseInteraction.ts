import { TabKey, Zones } from './Zones'

export interface XY { x: number, y: number }
export const XY0 = { x: 0, y: 0 }

export interface MouseInteraction {
    /** Tab on which the mouse button is simply pressed down. */
    tabDown: TabKey|undefined

    /** Whether the user actually started dragging the tab (mouse down + move a bit). */
    dragging: boolean

    /** The point where the user initially pressed the mouse button down, in client coordinates. */
    touchStart: XY,

    /** Where the top-left corner of the element was when the user started dragging it. */
    originalStart: XY,

    /** How far the mouse cursor has moved relative to the `touchStart` point. */
    offset: XY

    /** The index of the zone over whose "tab bar area" the dragged tab is hovering at the moment. */
    tabOverZone?: number

    hoverPosition?: number
}

export type ZoneTabAreas = {[index: number]: HTMLElement}
export type TabElements = {[key: string]: HTMLElement}

const initialMouse = {
    tabDown: undefined,
    offset: XY0,
    touchStart: XY0,
    originalStart: XY0,
    dragging: false
}
const forceToSplitOff = 10

/** Performs the immutable updates to mouse interaction state data (e.g. dragging) */
export class MouseInteractions {
    constructor(public data: MouseInteraction = initialMouse) { }

    move(x: number, y: number, zoneTabAreas: ZoneTabAreas, tabs: TabElements, zones: Zones): MouseInteractions {
        if (this.data.tabDown === undefined) { return this }
        const dragging = this.data.dragging || this.shouldStartDragging(x, y)
        if (!dragging) { return this }

        const tabOverZone = this.zoneUnderDraggedTab(zoneTabAreas, tabs)
        const hoverPosition = tabOverZone !== undefined ? this.calculateHoverPosition(x, y, tabOverZone, tabs, zones) : undefined

        const start = this.data.touchStart
        return new MouseInteractions({
            tabDown: this.data.tabDown,
            dragging: true,
            offset: { x: x - start.x, y: y - start.y },
            touchStart: start,
            originalStart: this.data.originalStart,
            tabOverZone,
            hoverPosition
        })
    }

    start(key: TabKey, x: number, y: number, tabs: TabElements): MouseInteractions {
        const tabRect = tabs[key].getBoundingClientRect()
        return new MouseInteractions({
            tabDown: key,
            dragging: false,
            offset: this.data.offset,
            touchStart: { x, y },
            originalStart: { x: tabRect.left, y: tabRect.top }
        })
    }

    shouldStartDragging(x: number, y: number) {
        return (
            Math.abs(x - this.data.touchStart.x) +
            Math.abs(y - this.data.touchStart.y)
            > forceToSplitOff
        )
    }

    zoneUnderDraggedTab(zoneTabAreas: ZoneTabAreas, tabs: TabElements): number|undefined {
        if (!this.data.dragging) { return undefined }

        const draggedTabRect = tabs[this.data.tabDown!].getBoundingClientRect()
        for (let i in zoneTabAreas) {
            const rect = zoneTabAreas[i].getBoundingClientRect()
            if (intersects(draggedTabRect, rect)) {
                return parseInt(i)
            }
        }
        return undefined
    }

    isDraggingTab(key: TabKey) {
        return this.data.dragging && this.data.tabDown === key
    }

    calculateHoverPosition(x: number, y: number, zoneIndex: number, tabs: TabElements, zones: Zones): number|undefined {
        if (!this.data.dragging) { return undefined }
        const draggedTabRect = tabs[this.data.tabDown!].getBoundingClientRect()

        let selfPositionOffset = 0
        for (let i=0; i<zones.data[zoneIndex].tabs.length; i++) {
            const tabKey = zones.data[zoneIndex].tabs[i]
            if (tabKey === this.data.tabDown) {
                selfPositionOffset = 1
                continue
            }

            const tabRect = tabs[tabKey].getBoundingClientRect()
            if (x < tabRect.left + tabRect.width/2) {
                return i - selfPositionOffset
            }
        }
        return zones.data[zoneIndex].tabs.length - selfPositionOffset
    }
}

function intersects(tab: ClientRect, area: ClientRect): boolean {
    return (
        tab.right > area.left && tab.left < area.right &&
        tab.bottom > area.top && tab.top < area.bottom
    )
}

function leftHalf(area: ClientRect): ClientRect {
    return {
        top: area.top, bottom: area.bottom, height: area.height,
        left: area.left,
        right: area.left + area.width / 2,
        width: area.width / 2
    }
}

function rightHalf(area: ClientRect): ClientRect {
    return {
        top: area.top, bottom: area.bottom, height: area.height,
        left: area.left + area.width / 2,
        right: area.right,
        width: area.width / 2
    }
}
