import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { SplittableTabs, Tab } from '../../src/SplittableTabs'
import { Zones } from '../../src/Zones'

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<Demo />, document.getElementById('root'))
})

interface State {
    controlledZones: Zones,
    savedTabs: Zones
}

class Demo extends React.Component<{}, State> {

    state: State = {
        controlledZones: new Zones(),
        savedTabs: new Zones()
    }

    render() {
        return <SplittableTabs style={{width: 1000, height: 900}}>
            <Tab title="Uncontrolled" eventKey={1} key={1}>
                <SplittableTabs style={{ width: 500, height: 500 }} debugColor='#00f' key={1}>
                    <Tab title="Tab U 1" eventKey={1}>
                    </Tab>
                    <Tab title="Tab U 2" eventKey={2}>
                    </Tab>
                    <Tab title="Tab U 3" eventKey={3}>
                    </Tab>
                </SplittableTabs>
            </Tab>
            <Tab title="Controlled" eventKey={2} key={2}>
                <SplittableTabs style={{ width: 500, height: 500 }} debugColor='#f00' key={2} zones={this.state.controlledZones} onAnyZoneChange={this.onControlledZoneChanged.bind(this)}>
                    <Tab title="Tab C 1" eventKey={1}>
                    </Tab>
                    <Tab title="Tab C 2" eventKey={2}>
                    </Tab>
                    <Tab title="Tab C 3" eventKey={3}>
                    </Tab>
                </SplittableTabs>
                <div>
                    <input type="button" value="Save" onClick={this.onControlledTabsSave.bind(this)} />
                    <input type="button" value="Restore" onClick={this.onControlledTabsRestore.bind(this)} />
                    <div>
                        Saved state:
                        {JSON.stringify(this.state.savedTabs)}
                    </div>
                </div>
            </Tab>
            <Tab title="Custom elements" eventKey={3} key={3}>
                <SplittableTabs style={{ width: 500, height: 500 }} debugColor='#0f0' key={3}>
                    <Tab title="Tab tab" eventKey={1} />
                </SplittableTabs>
                TODO: custom element support
            </Tab>
            <Tab title="Empty" eventKey={4} key={4}>
            </Tab>
        </SplittableTabs>
    }

    onControlledZoneChanged(newZones: Zones) {
        this.setState({ controlledZones: newZones })
    }

    onControlledTabsSave() {
        this.setState({ savedTabs: this.state.controlledZones })
    }

    onControlledTabsRestore() {
        this.setState({ controlledZones: this.state.savedTabs })
    }

}
