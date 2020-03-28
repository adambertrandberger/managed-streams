const path = require('path');

module.exports = {
    entry: [
        'babel-polyfill', // I had to add this to get async/await to work
        './src/main.js',
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'managed-streams.js',
        libraryTarget: 'umd',
        globalObject: 'this',
        library: 'ms',        
    },
    module: {
        rules: [
            {
                loader: 'babel-loader',
                test: /\.js$/,
                include: [path.resolve(__dirname, 'src')],
                exclude: /node_modules/,
                query: {
                    presets: ['@babel/env']
                }
            }
        ]
    }
};
