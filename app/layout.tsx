export const metadata = {
  title: "RunPod MCP Server",
  description: "RunPod GPU FaaS MCP Server for Claude",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
