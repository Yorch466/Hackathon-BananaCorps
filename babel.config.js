module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel', // <-- Movido aquí a los presets
    ],
    plugins: [
      'react-native-reanimated/plugin', // <-- Reanimated debe ser el único y el último aquí
    ],
  };
};
