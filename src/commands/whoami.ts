import { Command } from 'commander';
import { KlaroApi, KlaroApiError } from '../lib/api.js';
import { getToken } from '../lib/config.js';

async function whoamiAction(): Promise<void> {
  const token = getToken();
  if (!token) {
    console.error('Not logged in. Run "klaro login" first.');
    process.exit(1);
  }

  try {
    const api = new KlaroApi('app', token);
    const me = await api.getMe();
    console.log(me.nickname ? `${me.email} (${me.nickname})` : me.email);
  } catch (error) {
    if (error instanceof KlaroApiError) {
      console.error(`Failed to get user info: ${error.message}`);
    } else {
      console.error('Failed to get user info: An unexpected error occurred');
    }
    process.exit(1);
  }
}

export function createWhoamiCommand(): Command {
  return new Command('whoami')
    .description('Show the currently logged in user')
    .action(whoamiAction);
}
