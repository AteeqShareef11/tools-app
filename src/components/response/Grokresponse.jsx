import { useState, useEffect, useRef } from "react";

// ─── Markdown Parser ──────────────────────────────────────────────────────────
function parseMarkdown(text) {
    const lines = text.split("\n");
    const tokens = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (/^\*\*(.+?)\*\*:?\s*$/.test(line.trim())) {
            const match = line.trim().match(/^\*\*(.+?)\*\*:?\s*$/);
            tokens.push({ type: "heading", text: match[1].replace(/:$/, "") });
            i++;
            continue;
        }

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

        if (line.trim() !== "") {
            tokens.push({ type: "paragraph", text: line.trim() });
        }

        i++;
    }

    return tokens;
}

// ─── Inline Bold Renderer ─────────────────────────────────────────────────────
function InlineText({ text }) {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <strong key={i} style={{ fontWeight: 600, color: "#1a1a2e" }}>
                        {part}
                    </strong>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

// ─── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(fullText, speed = 18) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    const indexRef = useRef(0);
    const prevTextRef = useRef("");

    useEffect(() => {
        // Reset if content changes (new generation)
        if (fullText !== prevTextRef.current) {
            prevTextRef.current = fullText;
            indexRef.current = 0;
            setDisplayed("");
            setDone(false);
        }
    }, [fullText]);

    useEffect(() => {
        if (!fullText || done) return;

        const tick = () => {
            indexRef.current += 1;
            // Vary chunk size for natural feel: sometimes 1 char, sometimes 2-3
            const chunk = Math.random() > 0.7 ? 3 : Math.random() > 0.4 ? 2 : 1;
            indexRef.current = Math.min(indexRef.current + chunk - 1, fullText.length);
            setDisplayed(fullText.slice(0, indexRef.current));

            if (indexRef.current >= fullText.length) {
                setDone(true);
            }
        };

        const id = setTimeout(tick, speed);
        return () => clearTimeout(id);
    }, [displayed, fullText, speed, done]);

    return { displayed, done };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrokResponse({ content, showCopy = true }) {
    const [copied, setCopied] = useState(false);
    const { displayed, done } = useTypewriter(content, 14);
    const tokens = parseMarkdown(displayed);
    const bottomRef = useRef(null);

    // Auto-scroll as text streams in
    useEffect(() => {
        if (!done && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [displayed, done]);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap');

                .grok-wrap {
                    font-family: 'DM Sans', sans-serif;
                    background: #ffffff;
                    border: 1px solid #e8e8f0;
                    border-radius: 16px;
                    padding: 20px 22px 18px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(99,102,241,0.04);
                    max-width: 100%;
                    position: relative;
                }

                .grok-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f0f0f8;
                }

                .grok-avatar {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
                }

                .grok-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #9ca3af;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                }

                .grok-status {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    color: #a78bfa;
                    font-weight: 500;
                    margin-left: auto;
                }

                .grok-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #a78bfa;
                    animation: pulse-dot 1.2s ease-in-out infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.75); }
                }

                .grok-copy-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    color: #6b7280;
                    background: #f9f9fb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 5px 11px;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 500;
                    transition: background 0.15s, border-color 0.15s;
                    margin-left: auto;
                }
                .grok-copy-btn:hover { background: #f0f0fb; border-color: #c7d2fe; }

                .grok-body {
                    font-size: 14px;
                    line-height: 1.8;
                    color: #374151;
                }

                .grok-heading {
                    font-family: 'Lora', Georgia, serif;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e1b4b;
                    border-bottom: 1px solid #ede9fe;
                    padding-bottom: 6px;
                    padding-top: 16px;
                    margin: 0 0 8px;
                }
                .grok-heading:first-child { padding-top: 0; }

                .grok-paragraph {
                    color: #4b5563;
                    margin: 0 0 6px;
                    line-height: 1.8;
                }

                .grok-list {
                    list-style: none;
                    padding: 0;
                    margin: 4px 0 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .grok-list-item {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                    color: #4b5563;
                }

                .grok-bullet {
                    margin-top: 8px;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #a78bfa;
                    flex-shrink: 0;
                }

                /* Blinking cursor at end of stream */
                .grok-cursor {
                    display: inline-block;
                    width: 2px;
                    height: 14px;
                    background: #6366f1;
                    border-radius: 1px;
                    margin-left: 2px;
                    vertical-align: middle;
                    animation: blink 0.85s step-end infinite;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>

            <div className="grok-wrap">
                {/* Header */}
                <div className="grok-header">
                    <div className="grok-avatar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                fill="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <span className="grok-label">AI Response</span>

                    {!done ? (
                        <div className="grok-status">
                            <span className="grok-dot" />
                            Writing…
                        </div>
                    ) : (
                        showCopy && (
                            <button className="grok-copy-btn" onClick={handleCopy}>
                                {copied ? (
                                    <>
                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#10b981">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span style={{ color: "#10b981" }}>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="7" y="7" width="10" height="10" rx="2" />
                                            <path d="M3 13V5a2 2 0 012-2h8" />
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        )
                    )}
                </div>

                {/* Body */}
                <div className="grok-body">
                    {tokens.map((token, idx) => {
                        const isLast = idx === tokens.length - 1;
                        const showCursorHere = !done && isLast;

                        if (token.type === "heading") {
                            return (
                                <h2 key={idx} className="grok-heading">
                                    {token.text}
                                    {showCursorHere && <span className="grok-cursor" />}
                                </h2>
                            );
                        }

                        if (token.type === "paragraph") {
                            return (
                                <p key={idx} className="grok-paragraph">
                                    <InlineText text={token.text} />
                                    {showCursorHere && <span className="grok-cursor" />}
                                </p>
                            );
                        }

                        if (token.type === "list") {
                            return (
                                <ul key={idx} className="grok-list">
                                    {token.items.map((item, j) => {
                                        const isLastItem = j === token.items.length - 1;
                                        return (
                                            <li
                                                key={j}
                                                className="grok-list-item"
                                                style={{ marginLeft: item.depth > 0 ? "16px" : 0 }}
                                            >
                                                <span className="grok-bullet" />
                                                <span>
                                                    <InlineText text={item.content} />
                                                    {showCursorHere && isLastItem && <span className="grok-cursor" />}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            );
                        }

                        return null;
                    })}

                    {/* Cursor when no tokens yet (very start of stream) */}
                    {!done && tokens.length === 0 && <span className="grok-cursor" />}

                    <div ref={bottomRef} />
                </div>
            </div>
        </>
    );
}