const { override, addWebpackModuleRule } = require("customize-cra");

module.exports = override(
  addWebpackModuleRule({
    test: /\.map$/,
    enforce: "pre",
    use: ["source-map-loader"],
    exclude: [/node_modules\/chart\.js/], // Exclude Chart.js source maps
  })
);