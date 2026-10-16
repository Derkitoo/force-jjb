const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Web : la version ESM de zustand utilise import.meta, refusé dans un script classique
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;
