import { useDrivers } from '../hooks/useRace'

interface DriverSelectProps {
  id: string
  label: string
  value: string
  onChange: (driverId: string) => void
  disabled?: boolean
  exclude?: string[]
  pts?: number
}

export function DriverSelect({ id, label, value, onChange, disabled, exclude = [], pts }: DriverSelectProps) {
  const { data: drivers, isLoading, isError } = useDrivers()
  const options = drivers?.filter(d => !exclude.includes(d.driverId) || d.driverId === value)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-center gap-2 font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-dim">
        {label}
        {pts !== undefined && (
          <span className="font-mono text-[10px] text-f1-muted bg-f1-black border border-f1-border px-1.5 py-0.5 rounded">
            {pts} pts
          </span>
        )}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || isLoading || isError}
        className="bg-f1-black border border-f1-bright rounded-[5px] text-f1-text font-sans text-[14px] px-3.5 py-2.5 outline-none focus:border-f1-red transition-colors disabled:opacity-50 cursor-pointer appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: '36px',
        }}
      >
        <option value="">
          {isLoading ? 'Loading drivers…' : isError ? 'Failed to load' : 'Select a driver'}
        </option>
        {options?.map(driver => (
          <option key={driver.driverId} value={driver.driverId} style={{ background: '#1a1a1a' }}>
            {driver.givenName} {driver.familyName}
            {driver.code ? ` (${driver.code})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
