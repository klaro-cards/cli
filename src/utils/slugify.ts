/**
 * Convert a string to a URL-friendly slug.
 * - Removes accents (normalizes to NFD and strips diacritics)
 * - Converts to lowercase
 * - Replaces spaces and special characters with dashes
 * - Collapses multiple dashes
 * - Trims leading/trailing dashes
 */
export function slugify(text: string): string {
  return text
    .split('\n')[0]                        // Use only the first line
    .normalize('NFD')                    // Decompose accents (é -> e + ́)
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')         // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '')             // Trim leading/trailing dashes
    .replace(/-+/g, '-');                // Collapse multiple dashes
}
