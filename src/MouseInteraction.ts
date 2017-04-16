import { TabKey } from './Zones'

export interface XY { x: number, y: number }
export const XY0 = { x: 0, y: 0 }

export interface MouseInteraction {
    tabDown: TabKey|undefined
    offset: XY
    touchStart: XY,
    tabOverZone?: number
}

export type ZoneTabAreas = {[index: number]: HTMLDivElement}

const initialMouse = { tabDown: undefined, offset: XY0, touchStart: XY0 }

/** Performs the immutable updates to mouse interaction state data (e.g. dragging) */
export class MouseInteractions {
    constructor(public data: MouseInteraction = initialMouse) { }

    move(x: number, y: number, zoneTabAreas: ZoneTabAreas): MouseInteractions {
        if (this.data.tabDown === undefined) { return this }

        let tabOverZone: number|undefined = undefined
        for (let i in zoneTabAreas) {
            if (!zoneTabAreas[i]) { continue }
            const rect = zoneTabAreas[i].getBoundingClientRect()
            if (x > rect.left && y > rect.top && x < rect.right && y < rect.bottom) {
                tabOverZone = parseInt(i)
                break
            }
        }

        const start = this.data.touchStart
        return new MouseInteractions({
            tabDown: this.data.tabDown,
            offset: { x: x - start.x, y: y - start.y },
            touchStart: start,
            tabOverZone
        })
    }

    start(tab: TabKey, x: number, y: number): MouseInteractions {
        return new MouseInteractions({
            tabDown: tab,
            offset: this.data.offset,
            touchStart: { x, y }
        })
    }
}
