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
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Permissions-Policy",
            value: "",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: "",
          },
        ],
      },
    ];
  }
};

export default withBundleAnalyzer(withMDX(nextConfig));
