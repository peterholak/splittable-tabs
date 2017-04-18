const styles: {[key: string]: React.CSSProperties} = {
    tab: {
        display: 'inline-block',
        padding: '10px',
        cursor: 'pointer',
        userSelect: 'none',
        touchAction: 'none'
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
    },

    dropArea: {
        display: 'inline-block',
        verticalAlign: 'bottom',
        background: '#ccf'
    }
}

export default styles
