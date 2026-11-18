export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (!trimmed) {
    return { valid: false, error: "Username is required." };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters." };
  }
  if (trimmed.length > 25) {
    return { valid: false, error: "Username cannot exceed 25 characters." };
  }
  // Allow letters, numbers, underscores, and hyphens
  const regex = /^[a-zA-Z0-9_-]+$/;
  if (!regex.test(trimmed)) {
    return { valid: false, error: "Username can only contain letters, numbers, hyphens and underscores." };
  }
  return { valid: true };
}

export function formatAuthError(errorCodeOrMessage: string): string {
  const lower = errorCodeOrMessage.toLowerCase();
  if (lower.includes("user_already_exists") || lower.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("user_invalid_credentials") || lower.includes("invalid credentials") || lower.includes("invalid password")) {
    return "Invalid email or password.";
  }
  if (lower.includes("password_recently_used")) {
    return "Password has been used recently. Please choose a new password.";
  }
  if (lower.includes("rate_limit") || lower.includes("too many requests")) {
    return "Too many requests. Please wait a few minutes before trying again.";
  }
  return "Authentication failed. Please try again.";
}
