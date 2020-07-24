const path = require("path");

module.exports = {
    entry: {app: "./src/app.js"},
    output: {path: path.resolve(__dirname, "build"), filename: "app.js"},
    module: {
        rules: [{
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: "babel-loader"
        }]
    }
}