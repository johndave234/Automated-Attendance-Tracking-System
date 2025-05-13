module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@components': './client/src/components',
            '@screens': './client/src/screens',
            '@assets': './client/src/assets',
            '@config': './client/src/config',
            '@context': './client/src/context'
          }
        }
      ]
    ]
  };
}; 