import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}catch{playwright=require(process.env.PLAYWRIGHT_PATH)}
const output=path.resolve('tmp/global-ai-safety-qa');fs.mkdirSync(output,{recursive:true});
const root=path.resolve('_site');
const server=http.createServer((req,res)=>{
 let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/spherity-research/,'');
 if(name.endsWith('/'))name+='index.html';
 const filename=path.resolve(root,'.'+name);
 if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf','.json':'application/json'}[path.extname(filename)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime});fs.createReadStream(filename).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/spherity-research`;
const browser=await playwright.chromium.launch({headless:true,channel:'msedge'});
const report=[];
try{
 for(const [name,width,height] of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(base+'/top-10-global-ai-safety-companies-2026.html',{waitUntil:'networkidle'});
  await page.screenshot({path:path.join(output,name+'-header.png')});
  const figures=await page.locator('figure.paper-figure').count();
  const figureChecks=[];
  for(let i=0;i<figures;i++){
   const figure=page.locator('figure.paper-figure').nth(i);
   await figure.scrollIntoViewIfNeeded();
   await figure.locator('img').evaluate(img=>img.decode());
   figureChecks.push(await figure.evaluate(f=>({id:f.id,loaded:f.querySelector('img').complete,width:f.querySelector('img').naturalWidth,links:[...f.querySelectorAll('.figure-downloads a')].map(a=>a.href)})));
   if(name==='desktop'||i===3)await figure.screenshot({path:path.join(output,`${name}-figure-${i+1}.png`)});
  }
  await page.locator('.safety-assurance-pair').screenshot({path:path.join(output,name+'-assurance-pair.png')});
  const stats=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,tables:document.querySelectorAll('.safety-table-scroll table').length,references:document.querySelectorAll('.safety-references li').length,brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>a.hash&&!document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a=>a.hash),schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)),headings:[...document.querySelectorAll('h1')].map(h=>h.textContent.trim())}));
  const downloads=[...new Set(figureChecks.flatMap(f=>f.links))];
  if(figures!==5||downloads.length!==15)errors.push(`Expected 5 figures / 15 downloads, found ${figures} / ${downloads.length}`);
  for(const url of downloads){const response=await page.request.get(url);if(response.status()!==200)errors.push('Download '+response.status()+' '+url)}
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.getByRole('link',{name:'Read the research',exact:true}).first().scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,name+'-homepage.png')});
  const card=await page.locator('a[href$="top-10-global-ai-safety-companies-2026.html"]').count();
  const homeOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  report.push({name,errors,figureChecks,downloads:downloads.length,homepageLinks:card,homeOverflow,...stats});
  await page.close();
 }
 fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));
 console.log(report.map(({name,errors,width,scrollWidth,tables,references,brokenAnchors,downloads,homepageLinks,homeOverflow})=>({name,errors,width,scrollWidth,tables,references,brokenAnchors,downloads,homepageLinks,homeOverflow})));
 if(report.some(r=>r.errors.length||r.brokenAnchors.length||r.scrollWidth>r.width||r.homeOverflow))process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));}
