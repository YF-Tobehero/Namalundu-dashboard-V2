export const metadata = {
  title: "Namalundu Dashboard",
  description: "Namalundu Solar Project - Progress & Blockers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <style>{`* { margin:0; padding:0; box-sizing:border-box; } body { background:#0f172a; } ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
