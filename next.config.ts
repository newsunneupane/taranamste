import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', // Allows any path from this domain
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',//addcloudinary
        port: '',
        pathname: '/**', // Allows any path from this domain
      },
     
    ],
  },
};

export default nextConfig;
