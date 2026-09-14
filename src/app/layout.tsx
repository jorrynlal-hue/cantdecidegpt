import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CAN'T DECIDE GPT — Human life, work and services connected with powerful AI help",
  description: "The human-focused AI workspace. Connect your people, tasks, messages, meetings, files, projects and daily life with AI that prepares the work and keeps you in control of important actions.",
  icons: {
    icon: "/cantdecide-gpt-logo.png",
    shortcut: "/cantdecide-gpt-logo.png",
    apple: "/cantdecide-gpt-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-background text-foreground min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
