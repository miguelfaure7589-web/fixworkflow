import Link from "next/link";
import { CheckCircle, Zap, ArrowRight } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12 sm:py-24 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          You&apos;re all set!
        </h1>
        <p className="text-gray-500 mb-8">
          Your Premium subscription is now active. You have full access to all
          recommendations, integration maps, and automation blueprints.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-200"
        >
          Start Your Full Diagnosis
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
