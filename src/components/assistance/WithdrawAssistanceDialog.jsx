import { useState } from "react"
import { Button, Modal } from "../common/UI.jsx"
import { useDashboard } from "../../context/DashboardContext.jsx"
import { useFeedback } from "../common/Feedback.jsx"
import { isActiveAssistance } from "../../services/assistanceService.js"

export function WithdrawAssistanceDialog({ record }) {
  const { withdrawRequest, undoWithdrawal } = useDashboard()
  const { notify } = useFeedback()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const focusStatus = () =>
    requestAnimationFrame(() =>
      document.getElementById("assistance-status")?.focus(),
    )
  const withdraw = () => {
    try {
      const result = withdrawRequest(record.id)
      setOpen(false)
      focusStatus()
      notify("Assistance request withdrawn.", {
        undo: () => {
          try {
            undoWithdrawal(result.before)
            focusStatus()
            notify("Assistance request restored.")
          } catch (failure) {
            notify(failure.message, { type: "error" })
          }
        },
      })
    } catch (failure) {
      setError(failure.message)
    }
  }
  if (
    record.readOnly ||
    !isActiveAssistance(record) ||
    record.status === "outcome_recorded"
  )
    return null
  return (
    <>
      <Button
        variant="text"
        className="text-xs"
        onClick={() => {
          setOpen(true)
          setError("")
        }}
      >
        Withdraw Request
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Withdraw PESO assistance?"
      >
        <p className="text-sm leading-7">
          This will stop the active assistance process for this opportunity.
        </p>
        <p className="mt-3 text-sm font-semibold">{record.jobTitle}</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          This action changes your browser-only prototype request.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[#a4262c]">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => setOpen(false)}>Keep Request</Button>
          <Button variant="secondary" onClick={withdraw}>
            Withdraw Request
          </Button>
        </div>
      </Modal>
    </>
  )
}
