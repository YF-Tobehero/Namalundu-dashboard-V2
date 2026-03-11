export const metadata = {
  title: "Namalundu Dashboard",
  description: "Namalundu Solar Project - Progress & Blockers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◈</text></svg>" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
          body { background:#0f172a; overflow-x:hidden; }
          ::-webkit-scrollbar{width:4px;height:4px}
          ::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}
          ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}
          @media(max-width:767px){
            input,textarea{font-size:16px !important;}
            select{font-size:14px !important;}
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
