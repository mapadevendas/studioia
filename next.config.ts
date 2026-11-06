import type { NextConfig } from "next";

// O estúdio roda todo no navegador: sai como site estático (pasta out/),
// pronto para a Cloudflare publicar sem servidor Node.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
