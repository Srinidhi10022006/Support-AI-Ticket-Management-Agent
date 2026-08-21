export default function FilterDate({ label, value, onChange }) {
  return (
    <div className="rounded-3xl bg-white/70 border border-white/60 p-4">
      <p className="text-xs font-bold text-slate-600">{label}</p>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 w-full rounded-2xl bg-white/60 border border-white/60 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#007CC3]/30 focus:border-[#007CC3]/50"
      />
    </div>
  )
}
