import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as st from '../../src/SplittableTabs'

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<Demo />, document.getElementById('root'))
})

class Demo extends React.Component<{}, {}> {

    render() {
        return <st.SplittableTabs>
            <st.Tab title="Tab 1" eventKey={1}>
                Tab 1 contents yo!
            </st.Tab>
            <st.Tab title="Tab 2" eventKey={2}>
                Tab 222
            </st.Tab>
            <st.Tab title="Tab 3" eventKey={3}>
                Tab 333333333
            </st.Tab>
        </st.SplittableTabs>
    }

}
