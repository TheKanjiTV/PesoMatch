import { readdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"

export function pesoPwa() {
  let currentAssets = []
  return {
    name: "peso-private-safe-pwa",
    apply: "build",
    writeBundle(_options, bundle) {
      // Retained previous-release files must not change this release's ID or
      // become part of its service-worker asset allowlist.
      currentAssets = Object.keys(bundle)
        .filter((file) => file.startsWith("assets/"))
        .map((file) => `/${file}`)
    },
    async closeBundle() {
      const index = await readFile("dist/index.html", "utf8")
      const files = [
        "/offline.html",
        "/offline.js",
        "/icons/peso-192.png",
        "/icons/peso-512.png",
      ]
      const assets = [...currentAssets]
      for (const f of await readdir(path.join("dist", "fonts")))
        assets.push(`/fonts/${f}`)
      assets.sort()
      const release = createHash("sha256").update(index)
      for (const file of [...files, ...assets])
        release.update(file).update(await readFile(path.join("dist", file)))
      const version = release.digest("hex").slice(0, 12)
      await writeFile(
        "dist/sw.js",
        `const VERSION='${version}';
const CACHE='peso-shell-${version}';
const FILES=${JSON.stringify(files)};
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('peso-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data?.type==='GET_VERSION')e.ports[0]?.postMessage({version:VERSION});if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||u.pathname.startsWith('/sanctum/'))return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/offline.html')));return;}
 if(FILES.includes(u.pathname)||ASSETS.includes(u.pathname))e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(response=>{
   if(response.ok)e.waitUntil(caches.open(CACHE).then(cache=>cache.put(e.request,response.clone())).catch(()=>{}));
   return response;
 })));
});`,
      )
    },
  }
}
