import { assert } from 'chai'
import { Zones, TabKey, Zone, LastPosition } from '../src/Zones'

const zone = (tabs: TabKey[]) => ({ activeKey: tabs[0], sizePercent: 1, tabs })

describe('Zones opeartions', () => {
    describe('mergeInto', () => {
        const newZones1234 = () => new Zones([ zone([1, 2, 3]), zone([4]) ])

        it('places the merged tab at the correct position', () => {        
            const result = newZones1234().mergeInto(0, 4, 2)
            assert.deepEqual(result.data[0].tabs, [ 1, 2, 4, 3 ])
        }),

        it('places the merged tab at the end when LastPosition is used', () => {
            const result = newZones1234().mergeInto(0, 4, LastPosition)
            assert.deepEqual(result.data[0].tabs, [1, 2, 3, 4])
        }),

        it('places the tab at the correct position within its own zone', () => {
            const movedBackwards = newZones1234().mergeInto(0, 3, 0)
            assert.deepEqual(movedBackwards.data[0].tabs, [3, 1, 2])
            
            const movedForwards = newZones1234().mergeInto(0, 1, 2)
            assert.deepEqual(movedForwards.data[0].tabs, [2, 3, 1])
        })

        it('removes the old zone if there are no more tabs in it', () => {
            const result = newZones1234().mergeInto(0, 4)
            assert.equal(result.data.length, 1)
        })

        it('does not mutate the original data', () => {
            const zones = newZones1234()
            const duplicate = newZones1234()
            const result = zones.mergeInto(0, 4)
            assert.deepEqual(zones, duplicate)
            assert.notDeepEqual(zones, result)
        })
    })
})
