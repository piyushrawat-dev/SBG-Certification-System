import type { Metadata } from "next";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Certificate System | AWS Student Builders Group",
    template: "%s | AWS SBG Certificates",
  },
  description:
    "Certificate Management and Verification System for AWS Student Builders Group at Tulas University.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased">
        <Toaster richColors theme="dark" position="top-right" />
        {children}
      </body>
    </html>
  );
}
