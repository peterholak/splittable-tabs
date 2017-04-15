const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        bundle: './src/demo.tsx',
        vendors: [
            'react',
            'react-dom'
        ]
    },

    output: {
        filename: 'demo.js',
        path: __dirname + '/dist'
    },

    devtool: 'source-map',

    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },

    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
            { test: /\.js$/, enforce: 'pre', loader: 'source-map-loader'}
        ]
    },

    plugins: [
        new CopyWebpackPlugin([{
            from: 'src/index.html',
            to: '.'
        }]),
        new webpack.optimize.CommonsChunkPlugin({ name: 'vendors', filename: 'vendor.js' })
    ],

    // Suppress source-map-support warnings
    node: { fs: "empty", module: "empty" }
};
