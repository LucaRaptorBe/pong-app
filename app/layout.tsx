import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pong Game - 2 Players",
  description: "Classic Pong game for 2 players with local multiplayer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
