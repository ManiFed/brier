import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prism — Forecast Accuracy, Refracted",
  description:
    "Geometric calibration dashboard for evaluating prediction market accuracy with Brier, logarithmic, and spherical scores across exchanges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
