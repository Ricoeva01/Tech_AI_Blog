/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: {
      root: "/Users/ricoeva/Documents/TechIABlog",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;