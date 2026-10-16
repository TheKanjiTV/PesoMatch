import { saveJob, unsaveJob } from "../../services/jobsService.js"
import { saveTraining, unsaveTraining } from "../../services/trainingService.js"

import { useAuth } from "../../context/AuthContext.jsx"

import { useState } from "react"

import { Bookmark, Check } from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

import { useFeedback } from "./Feedback.jsx"

import { Button, Field, Modal } from "./UI.jsx"

export function SaveButton({
  id,

  training = false,

  compact = false,

  title = "",
}) {
  const data = useDashboard()

  const { user } = useAuth()

  const { notify } = useFeedback()

  const saved = training ? data.savedTraining : data.savedJobs

  const setSaved = training ? data.setSavedTraining : data.setSavedJobs

  const isSaved = saved.includes(id)

  return (
    <Button
      variant="secondary"
      aria-pressed={isSaved}
      aria-label={
        compact
          ? `${isSaved ? "Unsave" : "Save"} ${training ? "training" : "job"}${
              title ? `: ${title}` : ""
            }`
          : undefined
      }
      className={
        compact
          ? "min-h-9 size-9 !p-0 border-0 bg-muted text-muted-foreground"
          : ""
      }
      onClick={() => {
        if (training)
          setSaved((current) =>
            isSaved
              ? unsaveTraining(id, user.id, current)
              : saveTraining(id, user.id, current),
          )
        else
          setSaved((current) =>
            isSaved
              ? unsaveJob(id, user.id, current)
              : saveJob(id, user.id, current),
          )

        notify(
          isSaved
            ? `Removed from saved ${training ? "training" : "jobs"}.`
            : `${training ? "Training" : "Job"} saved.`,

          {
            undo: () => {
              if (training)
                setSaved((current) =>
                  isSaved
                    ? saveTraining(id, user.id, current)
                    : unsaveTraining(id, user.id, current),
                )
              else
                setSaved((current) =>
                  isSaved
                    ? saveJob(id, user.id, current)
                    : unsaveJob(id, user.id, current),
                )
            },
          },
        )
      }}
    >
      <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
      {!compact &&
        (isSaved ? "Saved" : training ? "Bookmark Training" : "Save Job")}
    </Button>
  )
}

export { AssistanceRequest } from "../assistance/RequestAssistanceModal.jsx"
