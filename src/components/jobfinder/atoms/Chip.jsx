const VARIANTS = {
    primary: "bg-[rgba(123,92,255,0.10)] text-[#B49AFF] border border-[rgba(123,92,255,0.20)]",
    secondary: "bg-[var(--ink-3)] text-[var(--text-subtle)] border border-[var(--line-2)]",
    gap: "bg-[rgba(255,92,123,0.08)] text-[#FF9DAE] border border-[rgba(255,92,123,0.20)]",
    strength: "bg-[rgba(0,229,180,0.08)] text-[#5FFFDA] border border-[rgba(0,229,180,0.15)]",
};

export function Chip({ label, variant = "primary" }) {
    return (
        <span
            className={`
        inline-flex items-center px-3 py-1 rounded-lg
        text-xs font-medium transition-colors duration-150 cursor-default
        ${VARIANTS[variant] ?? VARIANTS.primary}
      `}
        >
            {label}
        </span>
    );
}