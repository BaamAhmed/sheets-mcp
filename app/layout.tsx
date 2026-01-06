import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Google Sheets Server",
  description: "Model Context Protocol server for Google Sheets",
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

