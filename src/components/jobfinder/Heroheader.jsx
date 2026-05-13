/**
 * HeroHeader
 * Top section of the upload screen — pill badge, title, subtitle.
 */
export function HeroHeader() {
    return (
        <div className="text-center space-y-4 pt-4">
            {/* Powered-by pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-cab font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
                Powered by Claude Sonnet
            </div>

            {/* Title */}
            <h1 className="font-cab font-black text-5xl grad-text leading-none tracking-tight">
                AI Job Hunter
            </h1>

            {/* Subtitle */}
            <p className="text-slate-400 text-base max-w-sm mx-auto leading-relaxed">
                Upload your resume. Get matched with real jobs, gap analysis, and a
                strategic career roadmap.
            </p>
        </div>
    );
}