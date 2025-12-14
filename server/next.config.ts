import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import './_init';

// Create the next-intl plugin with proper configuration
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
  webpack: (config, {  }) => {
    // Exclude PowerShell scripts from being processed
    config.module.rules.push({
      test: /\.ps1$/,
      loader: 'ignore-loader'
    });

    return config;
  }
};

// Apply the next-intl plugin to the Next.js config
export default withNextIntl(nextConfig);
