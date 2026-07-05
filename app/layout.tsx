import Script from "next/script";
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import "./globals.css";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { VoiceInputModeProvider } from "@/contexts/VoiceInputModeContext";
import { ColorSchemeProvider } from "@/contexts/ColorSchemeContext";
import { ThemeScript } from "@/components/ThemeScript";

export const metadata: Metadata = {
  title: "S-3 Demo",
  description: "Demo page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      afterSignOutUrl="/"
    >
      <html lang="en" className="text-base">
        <head>
          <ThemeScript />
          <Script
            src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
            strategy="beforeInteractive"
          />
          <Script 
            src="https://unpkg.com/@phosphor-icons/web" 
            strategy="lazyOnload" 
          />
        </head>
        <body className="antialiased min-h-screen flex flex-col bg-slate-950">
          <ColorSchemeProvider>
            <FontSizeProvider>
              <VoiceInputModeProvider>
                {children}
              </VoiceInputModeProvider>
            </FontSizeProvider>
          </ColorSchemeProvider>
        </body>
      </html>
    </ClerkProvider>

  );
}
