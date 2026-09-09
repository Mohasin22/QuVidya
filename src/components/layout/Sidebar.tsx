import {
  BookOpen,
  BrainCircuit,
  ChevronDown,
  CircleHelp,
  Code2,
  LayoutDashboard,
  Settings2,
  Sparkles,
} from 'lucide-react'

type SidebarProps = {
  activeView: string
  onViewChange: (view: string) => void
}

const primaryNavigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Circuit simulator', icon: BrainCircuit },
  { label: 'Lessons', icon: BookOpen },
]

const tools = [
  { label: 'OpenQASM editor', icon: Code2 },
  { label: 'AI tutor', icon: Sparkles },
]

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#dbe2dd] bg-[#fbfcfa] px-5 py-5 lg:min-h-screen lg:w-[256px] lg:border-r lg:border-b-0 lg:px-6 lg:py-7">
      <div className="flex items-center justify-between lg:mb-14">
        <a className="flex items-center gap-3" href="/" aria-label="Q-Learn home">
          <span className="grid size-9 place-items-center rounded-[11px] bg-[#193d32] text-white shadow-[0_5px_15px_rgba(25,61,50,0.18)]">
            <span className="font-mono text-[15px] font-medium">Q</span>
          </span>
          <span className="text-[17px] font-extrabold tracking-[-0.04em]">Q-Learn</span>
        </a>
        <button className="rounded-lg p-2 text-[#6d7975] transition hover:bg-[#eef3ef] lg:hidden" type="button" aria-label="Open navigation">
          <ChevronDown size={18} />
        </button>
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-1 lg:mt-0 lg:block" aria-label="Primary navigation">
        <NavigationGroup label="Workspace" items={primaryNavigation} activeView={activeView} onViewChange={onViewChange} />
        <div className="hidden lg:block">
          <NavigationGroup label="Tools" items={tools} activeView={activeView} onViewChange={onViewChange} />
        </div>
      </nav>

      <div className="mt-6 hidden border-t border-[#e5ebe6] pt-5 lg:mt-auto lg:block">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#6d7975] transition hover:bg-[#eef3ef] hover:text-[#17211f]" type="button">
          <Settings2 size={17} strokeWidth={1.8} />
          Settings
        </button>
        <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#6d7975] transition hover:bg-[#eef3ef] hover:text-[#17211f]" type="button">
          <CircleHelp size={17} strokeWidth={1.8} />
          Help center
        </button>
        <div className="mt-7 flex items-center gap-3 rounded-xl bg-[#f0f4f0] p-3">
          <div className="grid size-8 place-items-center rounded-full bg-[#c7ded2] text-[11px] font-extrabold text-[#1c6b52]">SC</div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold">Student workspace</p>
            <p className="mt-0.5 text-[11px] text-[#7a8581]">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function NavigationGroup({ label, items, activeView, onViewChange }: { label: string; items: typeof primaryNavigation; activeView: string; onViewChange: (view: string) => void }) {
  return (
    <div className="mb-6">
      <p className="mb-2 hidden px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9aa49f] lg:block">{label}</p>
      {items.map(({ label: itemLabel, icon: Icon }) => {
        const isActive = activeView === itemLabel
        return (
          <button key={itemLabel} onClick={() => onViewChange(itemLabel)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition ${isActive ? 'bg-[#dff2e8] text-[#1c6b52]' : 'text-[#6d7975] hover:bg-[#eef3ef] hover:text-[#17211f]'}`} type="button">
            <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="truncate">{itemLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
