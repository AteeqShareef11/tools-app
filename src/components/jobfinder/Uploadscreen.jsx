import { useState } from "react";
import { UploadZone } from "./Uploadzone";
import { FeatureRow } from "./Featurerow";
import Heroheader from "./Heroheader";

// import { Spinner } from "../atoms";

/**
 * UploadScreen
 * The first screen the user sees. Handles:
 *   - resume file selection (via UploadZone)
 *   - triggering the analysis pipeline on submit
 *   - displaying API / extraction errors passed from the parent
 *
 * @param {{ onAnalyze: (file: File) => Promise<void>; error: string | null }} props
 */
export function UploadScreen({ onAnalyze, error }) {
    const [file, setFile] = useState(null);   // File | null
    const [loading, setLoading] = useState(false);
    const [localErr, setLocalErr] = useState(null);

    const handleSubmit = async () => {
        if (!file || loading) return;
        setLoading(true);
        setLocalErr(null);
        try {
            await onAnalyze(file);
        } catch (e) {
            setLocalErr(e.message ?? "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const displayError = localErr || error;

    return (
        <div className="min-h-screen bg-[#22222E]  flex items-center justify-center p-5">
            <div className="w-full max-w-md space-y-6">

                {/* Hero */}
                <Heroheader />

                {/* Error banner */}
                {displayError && (
                    <div
                        className="p-3 rounded-xl text-sm text-red-400 font-medium animate-fade-in"
                        style={{
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                        }}
                    >
                        ⚠️ {displayError}
                    </div>
                )}

                {/* Upload card */}
                <div className="glass rounded-3xl shadow-glow p-5 space-y-4">
                    {/* Step label */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-cab font-bold text-white"
                            style={{ background: "rgba(99,102,241,0.2)" }}
                        >
                            1
                        </div>
                        <span className="font-cab font-bold text-white text-sm">
                            Upload Your Resume
                        </span>
                    </div>

                    {/* Drop zone */}
                    <UploadZone onFileSelected={setFile} />

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!file || loading}
                        className="
              w-full py-3 rounded-xl text-white font-cab font-bold text-sm
              flex items-center justify-center gap-2
              transition-all duration-200
              disabled:opacity-30 disabled:cursor-not-allowed
              enabled:hover:opacity-90 enabled:hover:-translate-y-px
              enabled:active:scale-[0.98]
            "
                        style={{
                            background: !file || loading
                                ? "rgba(99,102,241,0.4)"
                                : "linear-gradient(135deg,#6366f1,#3b82f6)",
                        }}
                    >
                        {loading ? (
                            <>
                                {/* <Spinner size={18} color="#fff" /> */}
                                <span>Reading file…</span>
                            </>
                        ) : (
                            "Analyze Resume & Find Jobs →"
                        )}
                    </button>
                </div>

                {/* Features */}
                <FeatureRow />
            </div>
        </div>
    );
}