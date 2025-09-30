// app/layout.tsx
import React from "react";
import { Inter } from "next/font/google";  // Optional, for adding fonts

// Import your global styles if you have any
import "./globals.css"; 

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Votação Blockchain</title>
        {/* You can add more meta tags or links to external resources here */}
      </head>
      <body className={inter.className}>
        {children} {/* This renders the content of each page */}
      </body>
    </html>
  );
}
