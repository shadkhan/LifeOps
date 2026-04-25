import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeOps",
  description: "A personal operating system for future self, goals, habits, tasks, notes, and review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
