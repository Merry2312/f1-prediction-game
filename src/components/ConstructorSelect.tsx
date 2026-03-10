import { useConstructors } from '../hooks/useRace'

interface ConstructorSelectProps {
  id: string
  label: string
  value: string
  onChange: (constructorId: string) => void
  disabled?: boolean
}

export function ConstructorSelect({ id, label, value, onChange, disabled }: ConstructorSelectProps) {
  const { data: constructors, isLoading, isError } = useConstructors()

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
          {isLoading ? 'Loading constructors…' : isError ? 'Failed to load' : 'Select a constructor'}
        </option>
        {constructors?.map(constructor => (
          <option key={constructor.constructorId} value={constructor.constructorId}>
            {constructor.name}
          </option>
        ))}
      </select>
    </div>
  )
}
