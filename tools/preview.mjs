import http from 'node:http';
import net from 'node:net';
import { createHash } from 'node:crypto';
import { readFile, stat, mkdir, open } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'macrophage-atlas-v6';
const HTML_NAME = '巨噬细胞_生命内部.html';
const IDENTITY_PATH = '/.well-known/macrophage-atlas-preview.json';
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function argumentsFrom(argv) {
  const options = { port: 4195, launch: false, noOpen: false, check: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--launch') options.launch = true;
    else if (arg === '--serve') options.launch = false;
    else if (arg === '--no-open') options.noOpen = true;
    else if (arg === '--check') options.check = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (['--root', '--html', '--port'].includes(arg)) {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} 缺少参数。`);
      options[arg.slice(2)] = arg === '--port' ? Number(value) : value;
    } else throw new Error(`不认识的参数：${arg}。使用 --help 查看用法。`);
  }
  if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) {
    throw new Error('--port 应为 1024 到 65535 的整数。');
  }
  if (options.html && (path.basename(options.html) !== options.html || /[\\/]/.test(options.html))) {
    throw new Error('--html 只接受同目录文件名，不接受路径。');
  }
  return options;
}

async function existsFile(filename) {
  try { return (await stat(filename)).isFile(); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function loadPage(options) {
  let root = options.root ? path.resolve(options.root) : SCRIPT_DIR;
  let htmlName = options.html ?? HTML_NAME;
  // The same script also runs from tools/ in the editable source package.
  if (!options.root && !options.html && !await existsFile(path.join(root, htmlName))) {
    const sourceDist = path.resolve(SCRIPT_DIR, '..', 'dist');
    if (await existsFile(path.join(sourceDist, 'index.html'))) {
      root = sourceDist;
      htmlName = 'index.html';
    }
  }
  const filename = path.join(root, htmlName);
  let bytes;
  try { bytes = await readFile(filename); }
  catch (error) { throw new Error(`无法读取页面：${filename}\n请把 preview.mjs 与交付 HTML 放在同一目录，或指定 --root 和 --html。\n${error.message}`); }
  if (!bytes.includes(Buffer.from('<html')) || bytes.length < 1000) throw new Error(`页面不像有效的交付 HTML：${filename}`);
  return { root, htmlName, filename, bytes, htmlSha256: sha256(bytes) };
}

function requestDigest(url, maxBytes) {
  return new Promise(resolve => {
    const request = http.get(url, { timeout: 1500, headers: { 'Accept-Encoding': 'identity' } }, response => {
      if (response.statusCode !== 200) { response.resume(); resolve(null); return; }
      const digest = createHash('sha256');
      let length = 0;
      response.on('data', chunk => {
        length += chunk.length;
        if (length > maxBytes) { response.destroy(); resolve(null); return; }
        digest.update(chunk);
      });
      response.on('end', () => resolve(digest.digest('hex')));
      response.on('error', () => resolve(null));
    });
    request.on('timeout', () => { request.destroy(); resolve(null); });
    request.on('error', () => resolve(null));
  });
}

function requestIdentity(port) {
  return new Promise(resolve => {
    const request = http.get(`http://127.0.0.1:${port}${IDENTITY_PATH}`, { timeout: 1000 }, response => {
      if (response.statusCode !== 200) { response.resume(); resolve(null); return; }
      let data = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        data += chunk;
        if (data.length > 8192) { response.destroy(); resolve(null); }
      });
      response.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
      response.on('error', () => resolve(null));
    });
    request.on('timeout', () => { request.destroy(); resolve(null); });
    request.on('error', () => resolve(null));
  });
}

async function hasOurPage(port, page, allowDevServer = true) {
  const identity = await requestIdentity(port);
  if (identity?.projectId === PROJECT_ID && identity.htmlSha256 === page.htmlSha256) return true;
  // Existing source serve.mjs has no identity endpoint. Compare the entire HTML,
  // not a title or a merely occupied TCP port, before reusing that server.
  return allowDevServer && await requestDigest(`http://127.0.0.1:${port}/`, page.bytes.length) === page.htmlSha256;
}

function isPortOccupied(port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); reject(new Error(`检测本地端口 ${port} 超时。`)); });
    socket.once('error', error => {
      if (error.code === 'ECONNREFUSED') resolve(false);
      else reject(new Error(`检测本地端口 ${port} 失败：${error.message}`));
    });
  });
}

async function serve(page, port) {
  const identity = Buffer.from(JSON.stringify({ projectId: PROJECT_ID, htmlSha256: page.htmlSha256, htmlName: page.htmlName, bytes: page.bytes.length }));
  const htmlRoute = `/${encodeURIComponent(page.htmlName)}`;
  const server = http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    let pathname;
    try { pathname = new URL(request.url, 'http://127.0.0.1').pathname; }
    catch { response.writeHead(400); response.end('Bad request'); return; }
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    let bytes, type;
    if (pathname === IDENTITY_PATH) { bytes = identity; type = 'application/json; charset=utf-8'; }
    else if (pathname === '/' || pathname === '/index.html' || pathname === htmlRoute) { bytes = page.bytes; type = 'text/html; charset=utf-8'; }
    else { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('此预览服务只提供当前项目 HTML。'); return; }
    response.writeHead(200, { 'Content-Type': type, 'Content-Length': bytes.length, 'Cache-Control': 'no-store', 'X-Preview-Project': PROJECT_ID });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  }).catch(error => {
    throw new Error(error.code === 'EADDRINUSE' ? `端口 ${port} 已被占用。请用 --launch 自动检查并尝试备用端口，或指定 --port 4196。` : `无法启动本地预览：${error.message}`);
  });
  console.log(`本地预览：http://127.0.0.1:${port}/\n页面：${page.filename}\nSHA-256：${page.htmlSha256}\n本进程 PID：${process.pid}`);
  return server;
}

async function startDetached(page, port) {
  const logs = path.join(page.root, '.preview-logs');
  await mkdir(logs, { recursive: true });
  const logPath = path.join(logs, `preview-${port}.log`);
  const log = await open(logPath, 'a');
  let child;
  try {
    child = spawn(process.execPath, [SCRIPT_PATH, '--serve', '--root', page.root, '--html', page.htmlName, '--port', String(port)], {
      cwd: page.root, detached: true, windowsHide: true, stdio: ['ignore', log.fd, log.fd]
    });
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    child.unref();
  } finally { await log.close(); }
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await hasOurPage(port, page, false)) return logPath;
    if (child.exitCode !== null) break;
    await wait(150);
  }
  throw new Error(`预览服务未通过启动后的项目/HTML校验。日志：${logPath}。没有打开浏览器，也没有关闭占用端口的进程。`);
}

async function openBrowser(url) {
  let command, args;
  if (process.platform === 'win32') {
    command = process.env.ComSpec || 'cmd.exe';
    // URL is generated below from a numeric port, never from shell input.
    args = ['/d', '/s', '/c', `start "" "${url}"`];
  } else if (process.platform === 'darwin') { command = 'open'; args = [url]; }
  else { command = 'xdg-open'; args = [url]; }
  const child = spawn(command, args, { detached: true, windowsHide: true, stdio: 'ignore' });
  await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
  child.unref();
}

async function launch(page, options) {
  const ports = options.port < 65535 ? [options.port, options.port + 1] : [options.port];
  for (const port of ports) {
    let logPath;
    if (await isPortOccupied(port)) {
      if (!await hasOurPage(port, page)) {
        console.log(`端口 ${port} 提供的内容与本交付不同，跳过。`);
        continue;
      }
      console.log(`复用内容一致的本地预览：${port}`);
    } else {
      try { logPath = await startDetached(page, port); }
      catch (error) {
        console.error(error.message);
        if (port === options.port && ports.length > 1) continue;
        throw error;
      }
    }
    // Final identity/content confirmation before any browser or URL invocation.
    if (!await hasOurPage(port, page)) throw new Error('打开浏览器前的最终内容校验失败。');
    const url = `http://127.0.0.1:${port}/`;
    console.log(`已确认本项目：${url}${logPath ? `\n后台日志：${logPath}` : ''}`);
    if (!options.noOpen) {
      try { await openBrowser(url); }
      catch (error) { console.error(`服务已就绪，浏览器未自动打开：${error.message}\n请手动打开 ${url}`); }
    }
    return;
  }
  throw new Error(`端口 ${ports.join('、')} 均不可复用。请用 --port 指定其他端口。没有关闭任何其他服务。`);
}

async function main() {
  const options = argumentsFrom(process.argv.slice(2));
  if (options.help) {
    console.log('用法：node preview.mjs [--port 4195] [--root 文件夹 --html 文件名]\n  默认前台服务；--launch 启动独立后台服务并校验后打开浏览器。\n  --no-open 配合 --launch 只启动服务；--check 只检查 HTML，不启服务。\n  --launch 对内容不同的已占端口改试下一端口，不终止其他进程。');
    return;
  }
  const page = await loadPage(options);
  if (options.check) { console.log(JSON.stringify({ projectId: PROJECT_ID, root: page.root, htmlName: page.htmlName, bytes: page.bytes.length, htmlSha256: page.htmlSha256 }, null, 2)); return; }
  if (options.launch) await launch(page, options);
  else await serve(page, options.port);
}

main().catch(error => { console.error(`预览失败：${error.message}`); process.exitCode = 1; });
