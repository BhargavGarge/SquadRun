module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@hooks": "./src/hooks",
            "@contexts": "./src/contexts",
            "@services": "./src/services",
            "@utils": "./src/utils",
            "@theme": "./src/theme",
            "@navigation": "./src/navigation",
            "@types": "./src/types",
          },
        },
      ],
      "react-native-reanimated/plugin", // Must be last
    ],
  };
};
