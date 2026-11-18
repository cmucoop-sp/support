import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkFiles } from './files.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));

const SECRET_PATTERNS = [
  { name: 'Private Key Block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: 'GitHub Token', re: /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{30,}\b/ },
  { name: 'Google API Key', re: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { name: 'OpenAI / Secret API Key', re: /\bsk-[A-Za-z0-9]{32,}\b/ },
  { name: 'Slack Token', re: /\bxox[baprs]-[0-9A-Za-z\-]{20,}\b/ },
  { name: 'AWS Access Key ID', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Hardcoded Cloudflare D1 UUID in wrangler.toml', re: /database_id\s*=\s*["'][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}["']/i },
  { name: 'Hardcoded Private LAN IP URL', re: /http:\/\/(?:10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)/i },
  { name: 'Hardcoded RECOVERY_SALT / RECOVERY_HASH assignment', re: /\b(?:RECOVERY_SALT|RECOVERY_HASH|SESSION_SECRET|LINK_SECRET)\s*=\s*["'][^"']{4,}["']/ }
];

const findings = [];
const scanned = [];

for (const file of await walkFiles(root, new Set(['node_modules', '.git', 'previews', 'vendor']))) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (!/\.(?:js|mjs|html|css|toml|json|md|txt|yml|yaml)$/i.test(rel)) continue;
  if (rel === 'worker/scripts/secret-scan.mjs') continue;
  const content = await readFile(file, 'utf8');
  scanned.push(rel);
  for (const pat of SECRET_PATTERNS) {
    const match = pat.re.exec(content);
    if (match) {
      findings.push({ file: rel, rule: pat.name, sample: match[0].slice(0, 24) + '...' });
    }
  }
}

console.log(JSON.stringify({ scannedFiles: scanned.length, leakedKeysFound: findings.length, findings }, null, 2));
if (findings.length > 0) {
  console.error('ERROR: Potential secret or key leak detected! Remove secrets before committing to GitHub.');
  process.exitCode = 1;
}
