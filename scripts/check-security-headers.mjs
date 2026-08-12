import { exit } from "node:process"

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000"
const response = await fetch(baseUrl, { redirect: "manual" })

const expectedHeaders = new Map([
  ["content-security-policy", ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'"]],
  ["cross-origin-opener-policy", ["same-origin"]],
  ["permissions-policy", ["camera=()", "microphone=()"]],
  ["referrer-policy", ["strict-origin-when-cross-origin"]],
  ["strict-transport-security", ["max-age=31536000"]],
  ["x-content-type-options", ["nosniff"]],
  ["x-frame-options", ["DENY"]],
])

const failures = []

if (!response.ok) {
  failures.push(`expected a successful response, received ${response.status}`)
}

for (const [name, fragments] of expectedHeaders) {
  const value = response.headers.get(name)
  const passed = value !== null && fragments.every((fragment) => value.includes(fragment))
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)

  if (!passed) {
    failures.push(`${name} is missing or incomplete`)
  }
}

const poweredBy = response.headers.get("x-powered-by")
const poweredByHidden = poweredBy === null
console.log(`${poweredByHidden ? "PASS" : "FAIL"}: x-powered-by is hidden`)

if (!poweredByHidden) {
  failures.push("x-powered-by exposes framework information")
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  exit(1)
}
