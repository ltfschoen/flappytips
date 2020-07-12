const HtmlWebPackPlugin = require("html-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require("path");
const htmlPlugin = new HtmlWebPackPlugin({
  template: "./public/index.html", 
  filename: "./index.html"
});
const copyPlugin = new CopyPlugin({
  patterns: [
    { from: './public/favicon.ico', to: './' },
    { from: './public/manifest.json', to: './' },
    { from: './public/logo192.png', to: './' },
    { from: './public/logo512.png', to: './' },
    { from: './public/robots.txt', to: './' },
    { from: './public/assets/LemonMilkMedium.otf', to: './' }
  ],
});

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js"
  },
  plugins: [
    copyPlugin,
    // https://webpack.js.org/guides/output-management/#cleaning-up-the-dist-folder
    new CleanWebpackPlugin(),
    htmlPlugin
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.s?css$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/,
        loader: "file-loader",
        options: { name: "/[name].[ext]" }
      },
      {
        test: /favicon\.ico$/,
        loader: "url",
        query: { 
          limit: 1,
          name: "[name].[ext]",
        },
      },  
    ]
  }
};
