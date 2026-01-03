import indexPageHtml from './frontend/index.html';
import { agent } from './endpoints/agent';
import { rag } from './endpoints/rag';
import { conversations, conversation } from './endpoints/conversations';
import {
  philosophersEndpoint,
  philosopherDetailEndpoint,
} from './endpoints/philosophers';
import { philosopherQueryEndpoint } from './endpoints/philosopherQuery';
import { textsEndpoint } from './endpoints/texts';
import { signup, login, me } from './endpoints/auth';
import {
  getStats,
  clearRAG,
  reseedRAG,
  createBackup,
  listBackups,
  downloadBackup,
  restoreBackup,
  publishDocker,
  getDockerImages,
} from './endpoints/admin';
import { initializeAgent } from './utils/agent';
import { testConnection } from './db/connection';
import os from 'os';
import path from 'path';
import { existsSync } from 'fs';

console.log(
  `🚀 Starting bun server in ${process.env.NODE_ENV || 'development'} mode`
);

// Initialize database connection
await testConnection();

await initializeAgent();

const server = Bun.serve({
  port: process.env.PORT ?? 1738,
  hostname: process.env.HOSTNAME ?? 'localhost', // Use '0.0.0.0' for network access
  idleTimeout: 120,
  routes: {
    // Frontend routes
    '/': indexPageHtml,
    '/about': indexPageHtml,
    '/search': indexPageHtml,
    '/login': indexPageHtml,
    '/signup': indexPageHtml,
    '/admin': indexPageHtml,
    '/c/:id': indexPageHtml,
    // Auth routes
    '/auth/signup': { POST: signup },
    '/auth/login': { POST: login },
    '/auth/me': { GET: me },
    // Admin routes
    '/admin/stats': { GET: getStats },
    '/admin/rag/clear': { POST: clearRAG },
    '/admin/rag/reseed': { POST: reseedRAG },
    '/admin/backup': { POST: createBackup },
    '/admin/backups': { GET: listBackups },
    '/admin/backups/:filename': { GET: downloadBackup },
    '/admin/restore': { POST: restoreBackup },
    '/admin/publish': { POST: publishDocker },
    '/admin/docker/images': { GET: getDockerImages },
    // API routes
    '/agent': agent,
    '/rag': rag,
    '/api/philosophers': philosophersEndpoint,
    '/api/philosophers/:id': philosopherDetailEndpoint,
    '/api/ask-philosopher': philosopherQueryEndpoint,
    '/api/texts/:sourceId': textsEndpoint,
    '/conversations': conversations,
    '/conversations/:id': conversation,
  },
  async fetch(req: Request) {
    const url = new URL(req.url);

    // Serve static files from public directory
    const publicPath = path.join(import.meta.dir, '..', 'public', url.pathname);
    
    if (existsSync(publicPath)) {
      const file = Bun.file(publicPath);
      const ext = publicPath.split('.').pop()?.toLowerCase();
      
      // Map file extensions to content types
      const contentTypeMap: Record<string, string> = {
        'svg': 'image/svg+xml',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'json': 'application/json',
        'js': 'application/javascript',
      };
      
      const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';
      const headers: Record<string, string> = { 'Content-Type': contentType };
      
      // Add cache control for static assets
      if (['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      } else if (ext === 'json' && url.pathname === '/manifest.json') {
        headers['Cache-Control'] = 'public, max-age=3600';
      }
      
      return new Response(file, { headers });
    }

    // Let the router handle all other routes
  },
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        development: {
          hmr: true,
        },
      }),
} as any);

// Get local network IP address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();
const isNetworkAccessible = server.hostname === '0.0.0.0';

console.log(`\n💻 Web UI:`);
console.log(`    http://localhost:${server.port}        - Main chat interface`);
if (isNetworkAccessible) {
  console.log(
    `    http://${localIP}:${server.port}        - Network access (from other devices)`
  );
}
console.log(`    http://localhost:${server.port}/about     - About page`);
console.log(`    http://localhost:${server.port}/search    - Search page`);
console.log(`    http://localhost:${server.port}/login     - Login page`);
console.log(`    http://localhost:${server.port}/signup    - Signup page`);
console.log(
  `    http://localhost:${server.port}/c/:id     - Conversation by ID`
);

console.log('\n🔐 Auth Endpoints:');
console.log('  POST /auth/signup           - Create a new user account');
console.log('  POST /auth/login            - Authenticate a user');
console.log('  GET  /auth/me               - Get current user');

console.log('\n🤖 AI Endpoints:');
console.log(
  '  POST /agent                 - Agent with tools and conversation history'
);

console.log('\n📚 RAG Endpoints:');
console.log(
  '  POST /rag                   - Query vector store for relevant passages'
);
console.log('  GET  /rag                   - Get collection statistics');

console.log('\n🗣️  Conversation Endpoints:');
console.log(
  '  GET  /conversations         - List all conversations (auth required)'
);
console.log(
  '  POST /conversations         - Create a new conversation (auth required)'
);
console.log(
  '  GET  /conversations/:id     - Get a conversation with messages (auth required)'
);
console.log(
  '  PUT  /conversations/:id     - Update conversation title or messages (auth required)'
);
console.log(
  '  DELETE /conversations/:id   - Delete a conversation (auth required)'
);

console.log('\n🧙 Philosopher Endpoints:');
console.log('  GET  /api/philosophers      - List all indexed philosophers');
console.log('  GET  /api/philosophers/:id  - Get philosopher details');
console.log(
  '  POST /api/ask-philosopher   - Ask a philosopher a question (simulates tool call)'
);
console.log(
  '  GET  /api/ask-philosopher   - Ask a philosopher a question (via query params)'
);

console.log('\n📄 Text Endpoints:');
console.log('  GET  /api/texts/:sourceId   - Download a text source file');
