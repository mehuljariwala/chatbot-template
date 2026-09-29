import assert from "node:assert/strict"
import { test } from "node:test"
import { z } from "zod"

import { githubRepo } from "./github_repo.ts"

const schema = githubRepo.inputSchema

for (const repo of [
  "./users",
  "../users",
  "owner/.",
  "owner/..",
  "./..",
  "../.",
  "../..",
  "owner/repo/extra",
  "owner/repo?query=1",
  "owner/repo#fragment",
  "%2e%2e/users",
  "owner/%2e%2e",
  "owner\\repo",
  "/repo",
  "owner/",
]) {
  test(`rejects invalid repository path ${repo}`, () => {
    assert.equal(schema.safeParse({ repo }).success, false)
  })
}

for (const repo of [
  "vercel/next.js",
  "shadcn-ui/chatbot-template",
  "owner/.github",
  "owner/repo_name",
  "owner/repo..name",
]) {
  test(`preserves repository path ${repo}`, () => {
    assert.equal(schema.safeParse({ repo }).success, true)
    assert.equal(
      new URL(`https://api.github.com/repos/${repo}`).pathname,
      `/repos/${repo}`
    )
  })
}

test("exposes the path restriction in the model-facing JSON schema", () => {
  const jsonSchema = z.toJSONSchema(schema)
  const pattern = new RegExp(jsonSchema.properties.repo.pattern)
  assert.equal(pattern.test("../users"), false)
  assert.equal(pattern.test("owner/.."), false)
  assert.equal(pattern.test("owner/.github"), true)
})
