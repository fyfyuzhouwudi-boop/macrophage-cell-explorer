import {build} from 'esbuild';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
async function verifySources(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isSymbolicLink())throw new Error('Unexpected source link: '+file);
  if(entry.isDirectory())await verifySources(file);
  else if(/\.(?:js|css|html|json|svg)$/.test(entry.name)){
   const bytes=await readFile(file);
   if(!bytes.length||bytes.includes(0))throw new Error('Empty or NUL-corrupted source: '+file);
  }
 }
}
await verifySources(path.join(root,'src'));
const result=await build({entryPoints:[path.join(root,'src/main.js')],bundle:true,format:'iife',target:'es2020',minify:true,write:false,loader:{'.svg':'text','.png':'dataurl','.glb':'dataurl'},legalComments:'eof'});
const css=(await Promise.all(['style.css','annotations.css','visibility.css','steady-lesson-controls.css','uptake-presentation.css'].map(name=>readFile(path.join(root,'src',name),'utf8')))).join('\n');
const template=await readFile(path.join(root,'src/shell.html'),'utf8');
const html=template.replace('/*__STYLE__*/',()=>css).replace('/*__SCRIPT__*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir(path.join(root,'dist'),{recursive:true});
const artifact=path.join(root,'dist/index.html');
const temporary=artifact+'.build-tmp';
await writeFile(temporary,html);
if((await readFile(temporary,'utf8'))!==html)throw new Error('Build artifact verification failed');
const {rename}=await import('node:fs/promises');
await rename(temporary,artifact);
console.log(JSON.stringify({file:path.join(root,'dist/index.html'),bytes:Buffer.byteLength(html)}));
