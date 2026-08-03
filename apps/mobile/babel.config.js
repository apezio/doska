module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // No worklets plugin here: `babel-preset-expo` adds it whenever
    // `react-native-worklets` is installed, and running it twice leaves the
    // reanimated runtime uninstalled.
  }
}
