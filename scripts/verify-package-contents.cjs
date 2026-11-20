'use strict';
const {execFileSync}=require('node:child_process');
function verifyPackageContents(manifest, files) {
 const paths=new Set(files.map(file=>file.path));
 const required=['package.json',...(manifest.main?[manifest.main]:[]),...(manifest.n8n?.nodes||[]),...(manifest.n8n?.credentials||[])];
 if(!manifest.n8n?.nodes?.length || !manifest.n8n?.credentials?.length)throw Error('Missing n8n registration manifest');
 for(const file of required)if(!paths.has(file))throw Error('Package is missing registered file: '+file);
 for(const file of paths){
  if(/(^|\/)(?:\.pnpm-store|node_modules|\.git|\.env(?:\.[^/]*)?)(\/|$)|\.(?:tgz|tar|zip)$/i.test(file))throw Error('Unexpected private/build artifact in package: '+file);
  if(file!==manifest.main&&!file.startsWith('dist/')&&!/^(?:package\.json|readme(?:\.[^/]+)?|licen[cs]e(?:\.[^/]+)?)$/i.test(file))throw Error('Unexpected top-level package file: '+file);
 }
 return required.length;
}
if(require.main===module){
 const manifest=require('../package.json');
 const packed=JSON.parse(execFileSync('npm',['pack','--dry-run','--ignore-scripts','--json'],{cwd:require('node:path').join(__dirname,'..'),encoding:'utf8'}));
 if(packed.length!==1)throw Error('Expected exactly one package');
 const count=verifyPackageContents(manifest,packed[0].files);
 console.log(`Package contents verified: ${packed[0].files.length} files, ${count} required manifest entries`);
}
module.exports={verifyPackageContents};
