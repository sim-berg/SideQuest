export default function ImpressumPage() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4">
      <div className="w-full max-w-[1200px] h-[90vh] flex flex-col rounded-t-2xl overflow-hidden bg-white/80 backdrop-blur-md dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100/20 px-5 pb-3 pt-5 dark:border-slate-800/20">
          <a
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </a>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Impressum
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-400">
              Diese Seite wird in Kürze verfügbar sein. Vielen Dank für dein Verständnis!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
