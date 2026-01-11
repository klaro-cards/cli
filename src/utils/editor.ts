import { spawnSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Get the user's preferred editor from environment variables.
 * Follows the same convention as git: $VISUAL, then $EDITOR, then 'vi'.
 */
export function getEditor(): string {
  return process.env.VISUAL || process.env.EDITOR || 'vi';
}

/**
 * Open content in the user's editor and return the edited content.
 *
 * @param content - Initial content to edit
 * @param filename - Optional filename hint for the temp file (for syntax highlighting)
 * @returns The edited content, or null if the editor exited with an error
 */
export function openInEditor(content: string, filename = 'edit.md'): string | null {
  const tempPath = join(tmpdir(), `klaro-${Date.now()}-${filename}`);

  try {
    // Write content to temp file
    writeFileSync(tempPath, content, 'utf-8');

    // Get editor command
    const editor = getEditor();

    // Spawn editor and wait for it to close
    // Parse editor command to handle cases like "code --wait"
    const parts = editor.split(/\s+/);
    const cmd = parts[0];
    const args = [...parts.slice(1), tempPath];

    const result = spawnSync(cmd, args, {
      stdio: 'inherit',
    });

    if (result.status !== 0) {
      return null;
    }

    // Read edited content
    const edited = readFileSync(tempPath, 'utf-8');
    return edited;
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
