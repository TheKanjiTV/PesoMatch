import { useEffect, useState } from "react"

import { useNavigate } from "react-router"

import { useAuth } from "../../context/AuthContext.jsx"

import { useDashboard } from "../../context/DashboardContext.jsx"

import { useFeedback } from "../../components/common/Feedback.jsx"

import { Alert, Field as AccountField } from "../../app/auth/components.jsx"

import {
  Badge,
  Button,
  Modal,
  PageHeading,
  panel,
} from "../../components/common/UI.jsx"

import MobileNumberInput from "../../components/common/MobileNumberInput.jsx"

import {
  updateAccount,
  updatePassword,
  deleteAccount,
} from "../../services/account.js"

export function SettingsPage({ kind = "account" }) {
  const { user, refresh } = useAuth(),
    {
      serverProfile,

      profileLoading,

      profileError,

      reloadProfile,

      settings,

      setSettings,
    } = useDashboard(),
    { notify } = useFeedback(),
    navigate = useNavigate()

  const [values, setValues] = useState({
    first_name: user.first_name,

    last_name: user.last_name,

    middle_name: user.middle_name || "",

    email: user.email,

    mobile_number:
      serverProfile?.personal?.mobile_number?.replace(/^\+63/, "") || "",

    current_password: "",
  })

  const [validationFor, setValidationFor] = useState("")

  const [security, setSecurity] = useState({
      current_password: "",

      password: "",

      password_confirmation: "",
    }),
    [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [remove, setRemove] = useState(false),
    [deletePassword, setDeletePassword] = useState("")

  useEffect(() => {
    if (serverProfile?.personal?.mobile_number)
      setValues((before) => ({
        ...before,

        mobile_number: serverProfile.personal.mobile_number.replace(
          /^\+63/,

          "",
        ),
      }))
  }, [serverProfile?.personal?.mobile_number])

  const update = (key, value) => {
    setValues((before) => ({ ...before, [key]: value }))

    setErrors((before) => ({ ...before, [key]: undefined }))
  }

  async function save(event, kind) {
    event.preventDefault()

    if (busy) return

    setBusy(kind)

    setValidationFor(kind)

    setErrors({})

    setError("")

    try {
      if (kind === "account") {
        await updateAccount({
          ...values,

          mobile_number: `+63${values.mobile_number}`,
        })

        await refresh()

        await reloadProfile()

        setValues((before) => ({ ...before, current_password: "" }))

        notify("Account information updated.")
      } else {
        await updatePassword(security)

        setSecurity({
          current_password: "",

          password: "",

          password_confirmation: "",
        })

        notify("Password updated. Other sessions have been signed out.")
      }
    } catch (failure) {
      setError(failure.message)

      setErrors(failure.errors || {})
    } finally {
      setBusy("")
    }
  }

  async function destroy(event) {
    event.preventDefault()

    if (busy) return

    setBusy("delete")

    setError("")

    try {
      await deleteAccount({ current_password: deletePassword })

      Object.keys(localStorage)

        .filter((key) => key.startsWith(`pesomatch:demo:${user.id}:`))

        .forEach((key) => localStorage.removeItem(key))

      navigate("/home", { replace: true, flushSync: true })

      await refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy("")
    }
  }

  return (
    <>
      <PageHeading
        title={
          kind === "password"
            ? "Change Password"
            : kind === "delete"
              ? "Delete Account"
              : "Account Information"
        }
        description="Manage your account information, security and workspace preferences."
      />
      {error && !remove && (
        <div className="mb-5">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-1">
        {kind === "account" && (
          <section className={`${panel} p-5 sm:p-6`}>
            <h2 className="text-base font-semibold">Account Information</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Created {user.created_at?.slice(0, 10) || "recently"}. Changes are
              saved to your account.
            </p>
            {profileLoading && (
              <p role="status" className="mt-3 text-xs text-muted-foreground">
                Loading saved account details...
              </p>
            )}
            {profileError && (
              <div className="mt-3">
                <Alert tone="error">
                  We could not load your contact information. {profileError}
                </Alert>
                <Button
                  variant="secondary"
                  onClick={reloadProfile}
                  className="mt-2 text-xs"
                >
                  Try Again
                </Button>
              </div>
            )}
            <form
              onSubmit={(event) => save(event, "account")}
              className="mt-5 space-y-4"
            >
              <fieldset
                disabled={!!busy || profileLoading || !!profileError}
                className="min-w-0 space-y-4"
              >
                {[
                  ["first_name", "First Name"],

                  ["middle_name", "Middle Name (optional)"],

                  ["last_name", "Last Name"],

                  ["email", "Email"],
                ].map(([key, label]) => (
                  <AccountField
                    key={key}
                    label={label}
                    type={key === "email" ? "email" : "text"}
                    required={key !== "middle_name"}
                    value={values[key]}
                    onChange={(event) => update(key, event.target.value)}
                    error={
                      validationFor === "account" ? errors[key]?.[0] : undefined
                    }
                  />
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>
                    {user.email_verified_at ? "Verified" : "Unverified"}
                  </Badge>
                  {!user.email_verified_at && (
                    <Button
                      variant="text"
                      onClick={() =>
                        notify(
                          "No verification email was sent. Email delivery is not configured yet.",

                          { type: "info" },
                        )
                      }
                      className="text-xs"
                    >
                      Send Verification Email
                    </Button>
                  )}
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  Unverified accounts can use PesoMatch. Email delivery is not
                  configured in this local phase.
                </p>
                <MobileNumberInput
                  value={values.mobile_number}
                  onChange={(value) => update("mobile_number", value)}
                  required
                />
                {errors.mobile_number && (
                  <p className="text-xs text-[#a53232]">
                    {errors.mobile_number[0]}
                  </p>
                )}
                <AccountField
                  label="Current Password to save account changes"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={values.current_password}
                  onChange={(event) =>
                    update("current_password", event.target.value)
                  }
                  error={
                    validationFor === "account"
                      ? errors.current_password?.[0]
                      : undefined
                  }
                />
                <Button type="submit" className="text-xs">
                  {busy === "account"
                    ? "Saving..."
                    : "Save Account Information"}
                </Button>
              </fieldset>
            </form>
          </section>
        )}
        <div className="space-y-5">
          {kind === "password" && (
            <section className={`${panel} p-5 sm:p-6`}>
              <h2 className="text-base font-semibold">Password & Security</h2>
              <form
                onSubmit={(event) => save(event, "password")}
                className="mt-5 space-y-4"
              >
                <fieldset disabled={!!busy} className="min-w-0 space-y-4">
                  {[
                    ["current_password", "Current Password"],

                    ["password", "New Password"],

                    ["password_confirmation", "Confirm New Password"],
                  ].map(([key, label]) => (
                    <AccountField
                      key={key}
                      label={label}
                      type="password"
                      required
                      minLength={key === "current_password" ? undefined : 8}
                      maxLength={128}
                      autoComplete={
                        key === "current_password"
                          ? "current-password"
                          : "new-password"
                      }
                      value={security[key]}
                      onChange={(event) =>
                        setSecurity((before) => ({
                          ...before,

                          [key]: event.target.value,
                        }))
                      }
                      error={
                        validationFor === "password"
                          ? errors[key]?.[0]
                          : undefined
                      }
                    />
                  ))}
                  <Button type="submit" className="text-xs">
                    {busy === "password" ? "Updating..." : "Update Password"}
                  </Button>
                </fieldset>
              </form>
            </section>
          )}
          {kind === "delete" && (
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">Delete Account</h2>
              <p className="mt-2 text-xs leading-7 text-muted-foreground">
                Permanently remove your account and saved employment profile.
                This cannot be undone.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setError("")

                  setRemove(true)
                }}
                className="mt-3 text-xs text-[#a53232]"
              >
                Delete Account
              </Button>
            </section>
          )}
        </div>
      </div>
      <Modal
        open={remove}
        onClose={() => !busy && setRemove(false)}
        title="Delete your PesoMatch account?"
      >
        <p className="text-sm leading-7">
          Your account and profile will be permanently deleted. Enter your
          current password to confirm.
        </p>
        <form onSubmit={destroy} className="mt-5 space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <AccountField
            label="Confirm current password"
            type="password"
            required
            autoComplete="current-password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            disabled={!!busy}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!!busy} className="text-xs">
              {busy === "delete" ? "Deleting..." : "Permanently Delete Account"}
            </Button>
            <Button
              variant="secondary"
              disabled={!!busy}
              onClick={() => setRemove(false)}
              className="text-xs"
            >
              Keep My Account
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
