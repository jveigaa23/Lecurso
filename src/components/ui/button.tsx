import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "admin" | "admin-outline" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-ink hover:bg-gold-strong shadow-[0_8px_30px_-12px_rgb(198_161_91/0.55)]",
  secondary: "border border-line-strong text-paper hover:border-paper/60 hover:bg-white/[0.04]",
  ghost: "text-soft hover:text-paper",
  admin: "bg-admin-text text-white hover:bg-black",
  "admin-outline": "border border-admin-line bg-white text-admin-text hover:border-admin-text/40",
  danger: "bg-danger text-white hover:bg-[#cc3a3f]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-6 text-[0.95rem]",
  lg: "min-h-13 px-7 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
  pendingLabel?: string;
};

export function Button({ variant, size, pending, pendingLabel, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}

type ExternalButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size };

/** Link externo seguro (nova aba, sem acesso ao window.opener). */
export function ExternalButton({ variant, size, className, ...props }: ExternalButtonProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
