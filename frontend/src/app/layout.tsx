import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Stracel - Decentralized Marketplace on Celo",
  description: "Buy and sell goods securely on the Celo blockchain. A decentralized marketplace with escrow, dispute resolution, and reputation system.",
  keywords: ["blockchain", "marketplace", "celo", "decentralized", "web3", "crypto", "gdollar", "defi"],
  authors: [{ name: "Stracel Team" }],
  openGraph: {
    title: "Stracel - Decentralized Marketplace on Celo",
    description: "Buy and sell goods securely on the Celo blockchain",
    type: "website",
  },
  other: {
    "talentapp:project_verification": "66a114e9792693ac64380fd0db52b2aaaf7f519b7ef40f198de9954371a889f410db07108ca9f99b923094c081c3a30a6ae887a5eca5b6f152d84c9442cea343"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="antialiased h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
// NotificationPanel
