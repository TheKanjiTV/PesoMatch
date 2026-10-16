import { Field, Button } from "../common/UI.jsx"
import { getTrainings } from "../../services/trainingService.js"

export const trainingFilterFields = [
  ["skillCategory", "Skill Category"],
  ["category", "Training Category"],
  ["provider", "Provider"],
  ["location", "Location"],
  ["mode", "Delivery Mode"],
  ["availability", "Availability"],
  ["durationCategory", "Duration"],
]
const options = Object.fromEntries(
  trainingFilterFields.map(([key]) => [
    key,
    [...new Set(getTrainings().map((item) => item[key]))],
  ]),
)

export function TrainingFilters({ values, onChange, onClear, onApply }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onApply?.()
      }}
      className="space-y-4"
    >
      {trainingFilterFields.map(([key, label]) => (
        <Field
          key={key}
          label={label}
          value={values[key] || ""}
          onChange={(event) => onChange(key, event.target.value)}
        >
          <option value="">All {label.toLowerCase()}</option>
          {options[key].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Field>
      ))}
      {onApply && (
        <Button type="submit" className="w-full">
          Apply Filters
        </Button>
      )}
      <Button variant="secondary" className="w-full" onClick={onClear}>
        Clear Filters
      </Button>
    </form>
  )
}
