/**
 * Hosts cujas imagens passam pelo otimizador do Next (redimensionamento, AVIF/WebP).
 * Imagens de outros hosts HTTPS continuam funcionando, porém sem otimização.
 * Mantenha esta lista em sincronia com IMAGE_OPTIMIZED_HOSTS (lida em next.config.ts).
 */
export const DEFAULT_OPTIMIZED_HOSTS = ["res.cloudinary.com", "*.public.blob.vercel-storage.com"];

export function parseHostList(value: string | undefined): string[] {
  if (!value) return DEFAULT_OPTIMIZED_HOSTS;
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isOptimizableImage(src: string, hosts: readonly string[]): boolean {
  if (src.startsWith("/")) return true;
  try {
    const { hostname, protocol } = new URL(src);
    if (protocol !== "https:") return false;
    return hosts.some((pattern) =>
      pattern.startsWith("*.") ? hostname.endsWith(pattern.slice(1)) : hostname === pattern,
    );
  } catch {
    return false;
  }
}
