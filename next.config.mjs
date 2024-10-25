/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone',
    distDir: '.next',
    experimental: {
      esmExternals: true
    }
  };
  
  export default nextConfig;