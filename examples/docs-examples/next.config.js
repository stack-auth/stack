/** @type {import("next").NextConfig} */
module.exports = {
  webpack(config) {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
};
