/**
 * Validate a subdomain format.
 * @param subdomain - The subdomain to validate
 * @returns true if valid
 * @throws Error if the subdomain format is invalid
 */
export function validateSubdomain(subdomain: string): true {
  if (!subdomain) {
    throw new Error('Subdomain is required.');
  }

  // Subdomain should be alphanumeric with hyphens
  if (!/^[a-z0-9-]+$/i.test(subdomain)) {
    throw new Error('Invalid subdomain format. Use only letters, numbers, and hyphens.');
  }

  return true;
}
