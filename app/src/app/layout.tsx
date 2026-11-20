import type { Metadata } from "next";
import { locale } from "@/i18n";
import { AppShell } from "@/components/AppShell";
import { appCsp } from "@/lib/csp";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lista Criolla",
  description: "App web local — listas con cuenta (RFC v1)",
  referrer: "strict-origin-when-cross-origin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={locale}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={appCsp()} />
      </head>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
