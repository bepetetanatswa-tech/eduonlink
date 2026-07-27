import Link from "next/link";
import { IconAlertTriangle } from "@/components/icons";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-edu-paper">
      <div className="max-w-md w-full rounded p-8 text-center border border-edu-clay-200">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-edu-clay-100 text-edu-clay">
          <IconAlertTriangle size={26} />
        </div>
        <h1 className="font-display font-semibold text-edu-ink text-xl mb-3">Account suspended</h1>
        <p className="text-sm leading-relaxed mb-6 text-edu-slate-600">
          Your EduOnLink account has been suspended by an administrator. If you believe this is a mistake, please contact us.
        </p>
        <a
          href="mailto:bepetetanatswa@gmail.com"
          className="inline-block px-6 py-3 rounded text-sm font-semibold bg-edu-copper-100 border border-edu-copper-300 text-edu-copper-dark"
        >
          Contact support
        </a>
        <p className="text-xs mt-6">
          <Link href="/" className="text-edu-slate-500">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
