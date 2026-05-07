import { useState } from "react";

// Parses the markdown-style text from Grok into structured tokens
function parseMarkdown(text) {
    const lines = text.split("\n");
    const tokens = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Heading: **Some Text** on its own line (bold heading pattern from Grok)
        if (/^\*\*(.+?)\*\*:?\s*$/.test(line.trim())) {
            const match = line.trim().match(/^\*\*(.+?)\*\*:?\s*$/);
            tokens.push({ type: "heading", text: match[1].replace(/:$/, "") });
            i++;
            continue;
        }

        // Bullet point: lines starting with * or \t+
        if (/^\s*[*+]\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[*+]\s/.test(lines[i])) {
                const depth = lines[i].match(/^(\s*)/)[1].length > 0 ? 1 : 0;
                const content = lines[i].replace(/^\s*[*+]\s/, "").trim();
                items.push({ depth, content });
                i++;
            }
            tokens.push({ type: "list", items });
            continue;
        }

        // Non-empty line = paragraph
        if (line.trim() !== "") {
            tokens.push({ type: "paragraph", text: line.trim() });
        }

        i++;
    }

    return tokens;
}

// Renders inline bold (**text**) within a string
function InlineText({ text }) {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <strong key={i} className="font-medium text-gray-900 dark:text-gray-100">
                        {part}
                    </strong>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

export default function GrokResponse({ content, showCopy = true }) {




    const [copied, setCopied] = useState(false);
    const tokens = parseMarkdown(content);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-3xl mx-auto font-sans">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
                {/* Grok Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                            fill="white"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Grok
                </span>
                {showCopy && (
                    <button
                        onClick={handleCopy}
                        className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        {copied ? (
                            <>
                                <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Copied
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="7" y="7" width="10" height="10" rx="2" />
                                    <path d="M3 13V5a2 2 0 012-2h8" />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="space-y-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {tokens.map((token, idx) => {
                    if (token.type === "heading") {
                        return (
                            <h2
                                key={idx}
                                className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-1.5 pt-4 first:pt-0"
                            >
                                {token.text}
                            </h2>
                        );
                    }

                    if (token.type === "paragraph") {
                        return (
                            <p key={idx} className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                <InlineText text={token.text} />
                            </p>
                        );
                    }

                    if (token.type === "list") {
                        return (
                            <ul key={idx} className="space-y-1.5 py-0.5">
                                {token.items.map((item, j) => (
                                    <li
                                        key={j}
                                        className={`flex gap-2 items-start ${item.depth > 0 ? "ml-4" : ""}`}
                                    >
                                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            <InlineText text={item.content} />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    );
}

// ─── Usage Example ───────────────────────────────────────────────────────────
//
// import GrokResponse from "./GrokResponse";
//
// const rawContent = `
// **Freelance Proposal: React Developer Services**
// **Introduction:**
// I am a highly skilled and experienced React developer...
// **Services Offered:**
// * Development of custom React applications...
// * Integration of third-party APIs...
// `;
//
// function App() {
//   return (
//     <div className="p-6 bg-white dark:bg-gray-950 min-h-screen">
//       <GrokResponse content={rawContent} showCopy={true} />
//     </div>
//   );
// }