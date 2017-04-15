import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as st from '../../src/SplittableTabs'

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<Demo />, document.getElementById('root'))
})

class Demo extends React.Component<{}, {}> {

    render() {
        return <st.SplittableTabs>
            <st.Section title="Tab 1" eventKey={1}>
                Tab 1 contents yo!
            </st.Section>
            <st.Section title="Tab 2" eventKey={2}>
                Tab 222
            </st.Section>
            <st.Section title="Tab 3" eventKey={3}>
                Tab 333333333
            </st.Section>
        </st.SplittableTabs>
    }

}
