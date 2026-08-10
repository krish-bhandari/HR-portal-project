import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "RISE Research — HR Portal",
  description: "Internal HR portal for RISE Research team — leave management, announcements, shared calendar and team directory.",
  keywords: ["RISE Research", "HR Portal", "Leave Management", "Team Directory"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#060912" />
      </head>
      <body>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border-light)",
              color: "var(--text-primary)",
            },
          }}
          position="bottom-right"
          richColors
        />
      </body>
    </html>
  );
}
