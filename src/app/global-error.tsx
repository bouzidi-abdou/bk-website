"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f7f8",
          fontFamily: "system-ui, sans-serif",
          color: "#16161a",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            margin: 16,
            padding: 40,
            textAlign: "center",
            background: "#ffffff",
            border: "1px solid #e8e8ec",
            borderRadius: 28,
            boxShadow: "0 24px 60px -20px rgba(0,0,0,.15)",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              margin: "0 auto",
              borderRadius: 18,
              background: "#5865f2",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            BK
          </div>
          <h1 style={{ margin: "20px 0 0", fontSize: 22, fontWeight: 900 }}>
            BK MARKET — خطأ مؤقت
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.9, color: "#77777f" }}>
            حدث خطأ غير متوقع في الخادم. إن كنت صاحب الموقع، افتح
            <span style={{ fontFamily: "monospace" }}> /api/health </span>
            لتشخيص إعدادات الاستضافة وقاعدة البيانات.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 22,
              width: "100%",
              padding: "13px 0",
              border: 0,
              borderRadius: 16,
              background: "#16161a",
              color: "#fff",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            حاول مجدداً
          </button>
        </div>
      </body>
    </html>
  );
}
