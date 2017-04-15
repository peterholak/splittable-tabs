import * as React from 'react'
import * as PropTypes from 'prop-types'

export interface SectionProps {
    title: string
    eventKey: TabKey
    children?: React.ReactNode
}

export const Section = (props: SectionProps) => <div />
export type TabKey = string|number

export interface Props {
    
}

export interface State {
    activeKey: TabKey|undefined
}

export interface Context {
    activeKey: TabKey|undefined
}

export class SplittableTabs
    extends React.Component<Props, State>
    implements React.ChildContextProvider<Context>
{

    state: State = { activeKey: 1 }

    render() {
        
        const childProps = this.getChildProps()
        return <div>
            Splittable tabs:
            <div>
                {childProps.map(p => this.renderTab(p.title, p.eventKey))}
            </div>

            Content:
            <div>{this.getContentsForKey(childProps, this.state.activeKey)}</div>
        </div>
    }

    renderTab(title: string, key: TabKey) {

        const style = (key === this.state.activeKey ?
            { ...styles.tab, ...styles.activeTab } :
            styles.tab
        )
        return <div style={style} onClick={() => this.onTabClicked(key)}>
            {title}
        </div>

    }

    onTabClicked(key: TabKey) {
        this.setState({ activeKey: key })
    }

    getChildProps(): SectionProps[] {
        type SEL = React.ReactElement<SectionProps>
        return React.Children.
            toArray(this.props.children).
            filter(child => (child as SEL).type === Section).
            map(child => (child as SEL).props)
    }

    getContentsForKey(childProps: SectionProps[], key: TabKey|undefined) {
        const activeChildren = childProps.filter(child => child.eventKey === key)

        if (activeChildren.length === 0) { return undefined }

        return activeChildren[0].children
    }

    getChildContext() {
        return { activeKey: this.state.activeKey }
    }

    static childContextTypes = {
        activeKey: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ])
    }

}

const styles: {[key: string]: React.CSSProperties} = {
    tab: {
        display: 'inline-block',
        padding: '10px',
    },

    activeTab: {
        border: '1px solid #000',
        borderBottom: 'none'
    }
}
