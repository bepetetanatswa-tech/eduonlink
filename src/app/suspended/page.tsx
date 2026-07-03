import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#07080C" }}>
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,107,107,0.2)" }}
      >
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="font-display font-bold text-white text-xl mb-3">Account suspended</h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "#8892B0" }}>
          Your Educonnect account has been suspended by an administrator. If you believe this is a mistake, please contact us.
        </p>
        <a
          href="mailto:vavhimiacademy@gmail.com"
          className="inline-block px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF" }}
        >
          Contact support
        </a>
        <p className="text-xs mt-6">
          <Link href="/" style={{ color: "#4A5170" }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
