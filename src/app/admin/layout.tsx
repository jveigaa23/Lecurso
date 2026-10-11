import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div data-theme="admin" className="min-h-dvh bg-admin-bg text-admin-text [color-scheme:light]">
      {children}
    </div>
  );
}
