import 'dotenv/config';
import { spawn } from 'node:child_process';

const env = { ...process.env, NODE_ENV: 'test' };
if (process.env.DB_NAME_TEST) env.DB_NAME = process.env.DB_NAME_TEST;
const child = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run'], { stdio: 'inherit', env });
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
