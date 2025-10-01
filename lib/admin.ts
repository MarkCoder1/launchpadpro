// Admin utility functions
export const ADMIN_EMAILS = [
  // Add your admin email addresses here
  "marcalber59@gmail.com", // Replace with your actual admin email
  // "admin@yourcompany.com",
  // "owner@yourcompany.com",
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function requireAdmin(email: string | null | undefined): void {
  if (!isAdmin(email)) {
    throw new Error("Admin access required");
  }
}