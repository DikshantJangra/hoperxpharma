import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from 'sonner';
import QueryProvider from '@/components/providers/QueryProvider';
import "./globals.css";
import { KeyboardProvider } from "@/contexts/KeyboardContext";

export const metadata: Metadata = {
  title: "HopeRx Pharma",
  description: "Streamline Pharmacy Operations with Confidence!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <KeyboardProvider>
                <ToastProvider />
                {children}
              </KeyboardProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
