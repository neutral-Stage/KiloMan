import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kilo Shooter",
  description: "A 2D space shooter game",
  icons: {
    icon: "/KiloLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
