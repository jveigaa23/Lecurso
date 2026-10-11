import Image, { type ImageProps } from "next/image";
import { isOptimizableImage, parseHostList } from "@/lib/images";

/**
 * Wrapper de next/image para imagens configuradas no painel.
 * Usa o otimizador quando o host é conhecido; caso contrário, entrega a imagem original.
 */
export function SiteImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  const optimized = isOptimizableImage(src, parseHostList(process.env.IMAGE_OPTIMIZED_HOSTS));
  return <Image src={src} alt={alt} unoptimized={!optimized} {...props} />;
}
