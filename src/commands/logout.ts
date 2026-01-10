import { Command } from 'commander';
import { KlaroApi, KlaroApiError } from '../lib/api.js';
import { readConfig, writeConfig, getToken } from '../lib/config.js';

async function logoutAction(): Promise<void> {
  const token = getToken();
  if (!token) {
    console.log('Not logged in.');
    return;
  }

  try {
    const api = new KlaroApi('app', token);
    await api.logout();
  } catch (error) {
    if (error instanceof KlaroApiError) {
      console.error(`Failed to invalidate token: ${error.message}`);
    } else {
      console.error('Failed to invalidate token: An unexpected error occurred');
    }
    // Still clear local config even if server call fails
  }

  const config = readConfig();
  delete config.token;
  delete config.email;
  writeConfig(config);

  console.log('Logged out successfully.');
}

export function createLogoutCommand(): Command {
  return new Command('logout')
    .description('Logout from Klaro Cards')
    .action(logoutAction);
}
