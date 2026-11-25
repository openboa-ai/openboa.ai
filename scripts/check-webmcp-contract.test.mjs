import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { createYogurtAgent } from "@openboa/yogurt/agent"
import { registerTools } from "@ui-sdk/react/agent"

const root = new URL("../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")

test("@openboa/yogurt/agent and @ui-sdk/react/agent export WebMCP primitives", () => {
  assert.equal(typeof createYogurtAgent, "function")
  assert.equal(typeof registerTools, "function")
})

test("createYogurtAgent requires a host action policy and guards against SSR", () => {
  assert.throws(() => createYogurtAgent({}), TypeError)
  assert.throws(
    () => createYogurtAgent({ allow: (step) => !step.confirm }),
    /must be created in the browser/,
  )
})

test("OpenBoaProvider registers WebMCP tools inside useEffect with confirmation gating and cleanup", async () => {
  const provider = await read("src/components/openboa-context.tsx")
  assert.match(provider, /useEffect\(\(\) => \{\s*const agent = createYogurtAgent\(\{\s*allow:\s*\(step\)\s*=>\s*!step\.confirm,?\s*\}\)/s)
  assert.match(provider, /registerTools\(agent,\s*\{\s*allow:\s*\(\)\s*=>\s*true,?\s*\}\)/s)
  assert.match(provider, /if \(typeof unregister === "function"\) unregister\(\)/)
})

test("decorative WebGL canvas and corner reticles are hidden from agent snapshots", async () => {
  const [stage, hud] = await Promise.all([
    read("src/components/openboa-swarm-stage.tsx"),
    read("src/components/openboa-hud.tsx"),
  ])
  assert.ok(stage.includes('data-agent-hidden=""'))
  assert.ok(stage.includes('aria-hidden="true"'))
  assert.ok(hud.includes('data-agent-hidden=""'))
})
