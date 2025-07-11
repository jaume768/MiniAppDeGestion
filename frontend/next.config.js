/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuración para hot-reload en Docker
  experimental: {
    externalDir: true,
  },
  // Configuración para trabajar con API Django
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://api:8000/api/:path*', // Proxy hacia el servicio Django en Docker
      },
    ]
  },
}

module.exports = nextConfig
