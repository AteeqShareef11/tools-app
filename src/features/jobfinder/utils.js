/* eslint-disable preserve-caught-error */
import {
  ACCEPTED_MIME_TYPES,
  ACCEPTED_EXTENSIONS,
} from "../../components/jobfinder/constants";

// ─── FILE VALIDATION ──────────────────────────────────────────────────────────
/**
 * Validates whether the given File object is an accepted resume type.
 * @param {File} file
 * @returns {{ valid: boolean; reason?: string }}
 */
export function validateFile(file) {
  if (!file) return { valid: false, reason: "No file provided." };

  const mimeOk = ACCEPTED_MIME_TYPES.includes(file.type);
  const extOk = ACCEPTED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  if (!mimeOk && !extOk) {
    return {
      valid: false,
      reason: `Unsupported file type. Please upload a PDF, TXT, or MD file.`,
    };
  }

  const maxMB = 10;
  if (file.size > maxMB * 1024 * 1024) {
    return { valid: false, reason: `File is too large (max ${maxMB} MB).` };
  }

  return { valid: true };
}

// ─── PDF TEXT EXTRACTION ──────────────────────────────────────────────────────
/**
 * Extracts plain text from a PDF File using pdf.js (loaded via CDN on the page).
 * Falls back gracefully when the PDF has no selectable text.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractPdfText(file) {
  // pdf.js must be available as the global `pdfjsLib`
  if (typeof window.pdfjsLib === "undefined") {
    throw new Error(
      "PDF parser is not loaded. Ensure pdf.js is included in index.html.",
    );
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts = await Promise.all(
    Array.from({ length: pdf.numPages }, async (_, i) => {
      const page = await pdf.getPage(i + 1);
      const content = await page.getTextContent();
      return content.items.map((item) => item.str).join(" ");
    }),
  );

  const text = pageTexts.join("\n").trim();

  if (text.length < 80) {
    throw new Error(
      "Could not extract readable text from this PDF. " +
        "Please ensure it contains selectable text (not a scanned image).",
    );
  }

  return text;
}

// ─── PLAIN TEXT EXTRACTION ────────────────────────────────────────────────────
/**
 * Reads a plain-text / markdown File as a string.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result ?? "");
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

// ─── RESUME TEXT EXTRACTOR (dispatcher) ──────────────────────────────────────
/**
 * Dispatches to the correct extractor based on file type.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractResumeText(file) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const text = isPdf ? await extractPdfText(file) : await readTextFile(file);

  if (!text || text.trim().length < 80) {
    throw new Error(
      "Resume content is too short. Please check the file and try again.",
    );
  }

  return text.trim();
}

// ─── CLAUDE API CALL ──────────────────────────────────────────────────────────
/**
 * Sends resume text to Claude and returns the parsed analysis result.
 * @param {string} resumeText
 * @returns {Promise<{ candidate: object; jobs: object[] }>}
 */
export async function analyzeResume(resumeText) {
  if (!resumeText || resumeText.trim().length < 80) {
    throw new Error("Resume text too short");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("/api/analyzeResumeForJob", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({ resumeText }),
    });

    clearTimeout(timeout);

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!response.ok) {
      throw new Error(data?.error || "Analysis failed");
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Try again.");
    }

    throw new Error(err.message || "Network error");
  }
}
// ─── JSON PARSER ─────────────────────────────────────────────────────────────
/**
 * Strips markdown fences if present and parses JSON from Claude's response.
 * @param {string} raw
 * @returns {{ candidate: object; jobs: object[] }}
 */

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
/**
 * Human-readable file size.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Returns the uppercase extension label for a File.
 * @param {File} file
 * @returns {string}
 */
export function getFileLabel(file) {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf"))
    return "PDF";
  if (file.name.endsWith(".md")) return "MD";
  return "TXT";
}
