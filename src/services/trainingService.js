import { mockTrainings } from "../data/mockTrainings.js"
import { readDemo, writeDemo } from "./demoStore.js"

// FUTURE LARAVEL API: GET /api/trainings; GET /api/trainings/recommended
// GET /api/trainings/{training}; GET /api/saved-trainings
// POST /api/saved-trainings/{training}; DELETE /api/saved-trainings/{training}
const copy = (value) => structuredClone(value)
export const getTrainings = () => copy(mockTrainings)
export const getRecommendedTrainings = () =>
  getTrainings().filter((item) => item.jobIds.length)
export const getTrainingById = (id) =>
  copy(mockTrainings.find((item) => item.id === id) || null)
export const getSavedTrainings = (
  userId,
  ids = readDemo(userId, "saved-training"),
) => getTrainings().filter((item) => ids.includes(item.id))
export const saveTraining = (
  id,
  userId,
  ids = readDemo(userId, "saved-training"),
) =>
  writeDemo(
    userId,
    "saved-training",
    mockTrainings.some((item) => item.id === id)
      ? [...new Set([...ids, id])]
      : ids,
  )
export const unsaveTraining = (
  id,
  userId,
  ids = readDemo(userId, "saved-training"),
) =>
  writeDemo(
    userId,
    "saved-training",
    ids.filter((item) => item !== id),
  )
export function searchTrainings(
  { search = "", skill = "", job = "", ...filters } = {},
  source = getTrainings(),
) {
  const query = search.trim().toLowerCase()
  return source.filter(
    (item) =>
      (!query ||
        `${item.title} ${item.provider} ${item.skillsAddressed.join(" ")} ${item.category} ${item.location}`
          .toLowerCase()
          .includes(query)) &&
      (!skill ||
        item.skillsAddressed.some(
          (value) => value.toLowerCase() === skill.toLowerCase(),
        )) &&
      (!job || item.jobIds.includes(job)) &&
      Object.entries(filters).every(
        ([key, value]) => !value || item[key] === value,
      ),
  )
}
