import { ThemeSwitcher } from "@/components/theme-switcher";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { LoadingProvider } from "@/app/components/providers/loading-provider";
import { ToastProvider } from "@/app/components/ui/toast";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { FeedbackProvider } from "@/app/components/providers/feedback-provider";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Convenios UTN - Sistema de Gestión",
  description: "Sistema de gestión de convenios institucionales para la UTN",
};

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
            <ToastProvider>
              <FeedbackProvider>
                {children}
                <LoadingOverlay />
              </FeedbackProvider>
            </ToastProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
