import fs from 'node:fs';
function fix(file, fn) {
  const s = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, fn(s));
}
fix('src/routes/api/v1/servicios/+server.ts', s => s
  .replace("import type { RequestHandler } from './$types';\n", '')
  .replace("import type { RequestHandler } from './$types';\r\n", '')
  .replace("from '../_http'", "from '../../_http'")
  .replace('export const GET: RequestHandler = async ({ url })', 'export const GET = async ({ url }: { url: URL })')
  .replace('export const POST: RequestHandler = async ({ request })', 'export const POST = async ({ request }: { request: Request })')
);
fix('src/routes/api/v1/favores/+server.ts', s => s
  .replace("import type { RequestHandler } from './$types';\n", '')
  .replace("import type { RequestHandler } from './$types';\r\n", '')
  .replace("from '../../_http'", "from '../../_http'")
  .replace('export const GET: RequestHandler = async ({ url })', 'export const GET = async ({ url }: { url: URL })')
  .replace('export const POST: RequestHandler = async ({ request })', 'export const POST = async ({ request }: { request: Request })')
);
fix('src/routes/publicar/+page.svelte', s => s.replace("import { page } from '$app/stores';", "import { page } from '$app/state';"));
console.log('ok');
