import { Search, X } from 'lucide-react'

type GateSearchProps = {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  totalMatches?: number
  isSearching: boolean
}

export function GateSearch({
  value,
  onChange,
  onClear,
  totalMatches,
  isSearching,
}: GateSearchProps) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa49f]"
      />
      <input
        type="text"
        placeholder="Search gates..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#dfe7e1] bg-white py-2 pl-9 pr-14 text-[11px] font-medium text-[#17211f] placeholder:text-[#9aa49f] transition focus:border-[#1c6b52] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1c6b52]"
      />

      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {isSearching && totalMatches !== undefined && (
          <span className="rounded bg-[#e8f1eb] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#1c6b52]">
            {totalMatches}
          </span>
        )}
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="rounded p-1 text-[#9aa49f] transition hover:bg-[#eef3ef] hover:text-[#17211f]"
            aria-label="Clear gate search"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
