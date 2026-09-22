import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config: any, { isServer }: any) => {
    // Keep lucide-react client-only to avoid server createContext bundling issue (d.createContext is not a function)
    // No serverExternalPackages to avoid transpilePackages conflict
    return config;
  },
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
