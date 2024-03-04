import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkHeadingId from "remark-heading-id";

import createMDX from "@next/mdx";

import createBundleAnalyzer from "@next/bundle-analyzer";

const withMDX = createMDX({
  options: {
    rehypePlugins: [rehypeKatex],
    remarkPlugins: [remarkMath, remarkGfm, remarkHeadingId],
  },
});

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: !!process.env.ANALYZE_BUNDLE,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],

  // we're open-source, so we can provide source maps
  productionBrowserSourceMaps: true,

  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ["@mui/joy"],
  },

  // uncomment below to disable bundle minimization (useful for debugging prod builds)
  /*webpack(webpackConfig) {
    return {
      ...webpackConfig,
      optimization: {
        minimize: false
      }
    };
  },*/

  async headers() {
    return [
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
