import { createInterface } from 'node:readline';
import { Command } from 'commander';
import { KlaroApi, KlaroApiError } from '../lib/api.js';
import { readConfig, writeConfig } from '../lib/config.js';

async function prompt(question: string, hidden = false): Promise<string> {
  if (hidden && process.stdin.isTTY) {
    return new Promise((resolve) => {
      process.stdout.write(question);
      let input = '';

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const onData = (char: string) => {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(input);
        } else if (char === '\u0003') {
          process.stdin.setRawMode(false);
          process.exit(1);
        } else if (char === '\u007F' || char === '\b') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          input += char;
          process.stdout.write('*');
        }
      };

      process.stdin.on('data', onData);
    });
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function loginAction(): Promise<void> {
  const email = await prompt('Email: ');
  const password = await prompt('Password: ', true);

  if (!email || !password) {
    console.error('Email and password are required.');
    process.exit(1);
  }

  try {
    console.log('Logging in...');
    const api = new KlaroApi('app'); // subdomain not needed for login
    const result = await api.login(email, password);

    const config = readConfig();
    config.token = result.access_token;
    config.email = email;
    writeConfig(config);

    const expiresInDays = Math.round(result.expires_in / 86400);
    console.log(`Successfully logged in as ${email}`);
    console.log(`Token expires in ${expiresInDays} days`);
  } catch (error) {
    if (error instanceof KlaroApiError) {
      console.error(`Login failed: ${error.message}`);
    } else {
      console.error('Login failed: An unexpected error occurred');
    }
    process.exit(1);
  }
}

export function createLoginCommand(): Command {
  return new Command('login')
    .description('Login to Klaro Cards')
    .action(loginAction);
}
