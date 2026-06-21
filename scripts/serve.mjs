import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const START_PORT = parseInt(process.env.PORT || '3000');

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            resolve(false);
        } else {
            resolve(false);
        }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`Port ${port} is in use, trying ${port + 1}...`);
    port++;
    if (port > startPort + 100) break;
  }
  return port;
}

async function run(args) {
  const port = await findAvailablePort(START_PORT);
  console.log(`Starting Next.js on available port: ${port}`);
  
  // Point to the actual JS entry point of Next.js CLI
  const nextCliJs = path.resolve(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
  
  // Run it using the current node executable
  const child = spawn(process.execPath, [nextCliJs, ...args, '-p', port.toString()], {
    stdio: 'inherit',
    env: { ...process.env, PORT: port.toString() }
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error('Failed to start Next.js process:', err);
    console.log('Attempted to execute JS via Node:', nextCliJs);
    process.exit(1);
  });
}

const action = process.argv[2] || 'dev';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (action === 'start') {
    run(['start']).catch(console.error);
  } else {
    run(['dev']).catch(console.error);
  }
}
