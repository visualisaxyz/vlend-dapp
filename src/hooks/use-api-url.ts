export default function useApiUrl(_chainIdParam?: number) {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.vlend.visualisa.xyz"
  // Use proxy in browser when on localhost to avoid CORS (backend only allows vlend.visualisa.xyz)
  if (
    typeof window !== "undefined" &&
    (window.location.origin.includes("localhost") ||
      window.location.origin.includes("127.0.0.1"))
  ) {
    return "/api/proxy"
  }
  return base
}
