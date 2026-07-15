import { spawn } from 'node:child_process';

async function run(command: string, args: string[]): Promise<void> {
  console.log(`[global-setup] running: ${command} ${args.join(' ')}`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env: process.env, shell: true });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function globalSetup(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      '[global-setup] DATABASE_URL is not set. Add it to .env so seed scripts can connect to Postgres.',
    );
  }

  // E2E fixtures (tenant + package) must be seeded before super-admin so the
  // tenant row can reference an existing admin user (tenants.userId is NOT NULL).
  await run('pnpm', ['seed:e2e']);
  await run('pnpm', ['seed']);
}

export default globalSetup;
