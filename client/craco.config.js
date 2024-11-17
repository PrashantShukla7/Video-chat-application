module.exports = {
    webpack: {
      configure: (config) => {
        config.resolve.fallback = {
          buffer: require.resolve('buffer/')
        };
        return config;
      },
    },
  };
  