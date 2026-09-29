import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.2.2', '192.168.0.101', '192.168.0.101:3000', '192.168.0.101:3001', 'localhost:3000'],
}

export default nextConfig
