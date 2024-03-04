/** @type {import("next").NextConfig} */
module.exports = {
  productionBrowserSourceMaps: true,
  webpack(config) {
    config.experiments = { ...config.experiments, topLevelAwait: true }
    return config
  },
}
