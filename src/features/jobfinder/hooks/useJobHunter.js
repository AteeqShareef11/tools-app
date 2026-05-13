import { useState, useCallback, useRef } from "react";
import {
  ANALYSIS_STEPS,
  SCREENS,
} from "../../../components/jobfinder/constants";
import { analyzeResume, extractResumeText } from "../utils";

/**
 * useJobHunter
 *
 * Central state + logic hook for the AI Job Hunter app.
 * Owns: screen routing, file state, analysis result, error, and progress.
 */
export function useJobHunter() {
  const [screen, setScreen] = useState(SCREENS.UPLOAD);
  const [file, setFile] = useState(null); // File | null
  const [candidate, setCandidate] = useState(null); // parsed candidate object
  const [jobs, setJobs] = useState([]); // parsed jobs array
  const [error, setError] = useState(null); // string | null
  const [stepMsg, setStepMsg] = useState(ANALYSIS_STEPS[0]);

  // keep a ref so the interval callback always sees the latest index
  const stepIdxRef = useRef(0);

  // ── helpers ──────────────────────────────────────────────────────────────

  const startProgressCycle = useCallback(() => {
    stepIdxRef.current = 0;
    setStepMsg(ANALYSIS_STEPS[0]);

    const iv = setInterval(() => {
      stepIdxRef.current = Math.min(
        stepIdxRef.current + 1,
        ANALYSIS_STEPS.length - 1,
      );
      setStepMsg(ANALYSIS_STEPS[stepIdxRef.current]);
    }, 2800);

    return iv;
  }, []);

  // ── public API ───────────────────────────────────────────────────────────

  /**
   * Kick off the full analysis pipeline for the given File.
   * @param {File} selectedFile
   */
  const startAnalysis = useCallback(
    async (selectedFile) => {
      setError(null);
      setFile(selectedFile);
      setScreen(SCREENS.ANALYZING);

      const iv = startProgressCycle();

      try {
        const resumeText = await extractResumeText(selectedFile);
        const result = await analyzeResume(resumeText);

        clearInterval(iv);

        setCandidate({
          ...result.candidate,
          jobCount: result.jobs?.length ?? 0,
        });
        setJobs(result.jobs ?? []);
        setScreen(SCREENS.RESULTS);
      } catch (err) {
        clearInterval(iv);
        setError(err.message ?? "Analysis failed. Please try again.");
        setScreen(SCREENS.UPLOAD);
      }
    },
    [startProgressCycle],
  );

  /**
   * Reset everything back to the upload screen.
   */
  const reset = useCallback(() => {
    setScreen(SCREENS.UPLOAD);
    setFile(null);
    setCandidate(null);
    setJobs([]);
    setError(null);
    setStepMsg(ANALYSIS_STEPS[0]);
  }, []);

  return {
    // state
    screen,
    file,
    candidate,
    jobs,
    error,
    stepMsg,
    // actions
    startAnalysis,
    reset,
  };
}
