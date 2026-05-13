/**
 * TabBar
 * Two-tab switcher between Profile and Jobs views.
 *
 * @param {{ active: string; setActive: (id: string) => void; jobCount: number }} props
 */
export function TabBar({ active, setActive, jobCount }) {
  const tabs = [
    { id: "profile", label: "👤 Profile" },
    { id: "jobs",    label: `💼 Jobs (${jobCount})` },
  ];

  return (
    <div
      className="flex gap-1 p-1 rounded-xl mb-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border:     "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={`
            flex-1 py-2 rounded-lg text-sm font-cab font-bold
            transition-all duration-200
            ${active === tab.id
              ? "bg-white/10 text-white"
              : "text-slate-500 hover:text-slate-300"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
