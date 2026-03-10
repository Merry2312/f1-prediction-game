import { useDrivers } from '../hooks/useRace'

interface DriverSelectProps {
  id: string
  label: string
  value: string
  onChange: (driverId: string) => void
  disabled?: boolean
  exclude?: string[]
}

export function DriverSelect({ id, label, value, onChange, disabled, exclude = [] }: DriverSelectProps) {
  const { data: drivers, isLoading, isError } = useDrivers()

  const options = drivers?.filter(d => !exclude.includes(d.driverId) || d.driverId === value)

  return (
    <div>
      <label htmlFor={id} className="block text-gray-300 text-sm mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || isLoading || isError}
        className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-red-500 disabled:opacity-50"
      >
        <option value="">
          {isLoading ? 'Loading drivers…' : isError ? 'Failed to load' : 'Select a driver'}
        </option>
        {options?.map(driver => (
          <option key={driver.driverId} value={driver.driverId}>
            {driver.givenName} {driver.familyName}
            {driver.code ? ` (${driver.code})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
