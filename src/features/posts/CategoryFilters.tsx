import type { PostType } from '../../types'

const options: { label: string; value: PostType }[] = [
  { label: 'Status', value: 'status' },
  { label: 'Ask', value: 'ask' },
  { label: 'Activity', value: 'activity' },
  { label: 'Item', value: 'item' }
]

type CategoryFiltersProps = {
  activeTypes: PostType[]
  onChange: (types: PostType[]) => void
}

export function CategoryFilters({ activeTypes, onChange }: CategoryFiltersProps) {
  const toggle = (value: PostType) => {
    if (activeTypes.includes(value)) {
      onChange(activeTypes.filter((type) => type !== value))
    } else {
      onChange([...activeTypes, value])
    }
  }

  return (
    <div className="map-overlay category-filters">
      {options.map((option) => (
        <button
          key={option.value}
          className={activeTypes.includes(option.value) ? 'is-active' : ''}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
