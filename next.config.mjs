/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      { source: "/portal.js", headers: [{ key: "Cache-Control", value: "private, no-cache" }] },
      { source: "/portal.css", headers: [{ key: "Cache-Control", value: "private, no-cache" }] },
      { source: "/", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/login", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
export default nextConfig;
