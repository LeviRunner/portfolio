import type { NextConfig } from "next";

// O site é estático e servido de um domínio próprio pelo Cloudflare Workers
// (ver wrangler.jsonc), então não há imagens remotas nem basePath para configurar.
const nextConfig: NextConfig = {};

export default nextConfig;
