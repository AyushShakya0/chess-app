import test from "node:test";
import assert from "node:assert/strict";
import { formatAuthError, validateUsername } from "../lib/appwrite/auth-helpers.ts";

test("Auth Helpers - validates usernames and formats oauth errors", () => {
  assert.equal(validateUsername("Grandmaster123").valid, true);
  assert.equal(validateUsername("").valid, false);
  assert.equal(validateUsername("ab").valid, false); // min 3 chars
  assert.equal(validateUsername("bad name!").valid, false); // alphanumeric only
});

test("Auth Helpers - formats common appwrite and oauth errors", () => {
  assert.equal(formatAuthError("user_already_exists"), "An account with this email already exists.");
  assert.equal(formatAuthError("user_invalid_credentials"), "Invalid email or password.");
  assert.equal(formatAuthError("unknown_error"), "Authentication failed. Please try again.");
});
