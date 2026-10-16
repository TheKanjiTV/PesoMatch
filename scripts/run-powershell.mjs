import { spawnSync } from "node:child_process"
import path from "node:path"
const binary = path.join(
  process.env.SystemRoot || "C:\\Windows",
  "System32",
  "WindowsPowerShell",
  "v1.0",
  "powershell.exe",
)
const result = spawnSync(
  binary,
  [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", windowsHide: true },
)
if (result.error) {
  process.stderr.write(result.error.message + "\n")
  process.exit(1)
}
process.exit(result.status ?? 1)
