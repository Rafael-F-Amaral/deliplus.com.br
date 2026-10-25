import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
    '192.168.0.101',
    '192.168.0.101:3000',
    '192.168.0.102',
    '192.168.0.102:3000',
    '10.0.2.2',
  ],
}

export default nextConfig
