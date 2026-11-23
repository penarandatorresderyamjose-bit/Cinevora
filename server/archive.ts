import { ApiError, cached, compactText, getJson, pageParam, textParam } from './utils.js';
const BASE = 'https://archive.org';
export type License = { label: string; url: string; terms: string };
export type ArchiveVariant = {
  id: number; fileName: string; fileSize: number; fileFormat: string;
  width: number | null; height: number | null; quality: string;
  language: 'es'|'en'|null; languageSource: 'archivo'|'metadatos'|null;
};
export type ArchiveItem = {
  identifier: string; title: string; description: string; creator: string; year: string;
  image: string; sourceUrl: string; license: License;
  fileName: string; fileSize: number; fileFormat: string;
  downloadUrl: string | null; downloadVerified: boolean;
  declaredLanguages: ('es'|'en')[]; variants: ArchiveVariant[];
};
function firstString(val: unknown): string {
  return Array.isArray(val) ? String(val[0] || '') : typeof val === 'string' ? val : '';
}
export function licenseInfo(raw: unknown): License | null {
  const value = firstString(raw);
  const u = value.match(/https?:\/\/(?:www\.)?creativecommons\.org\/(?:licenses\/(?:by(?:-sa|-nc|-nd|-nc-sa|-nc-nd)?|zero)\/\d\.\d|publicdomain\/(?:mark|zero)\/1\.0)\/?/i)?.[0];
  if (!u) return null;
  const url = u.replace(/^http:/,'https:');
  if (/\/publicdomain\/mark\//.test(url)) return { label:'Marcada como dominio público',url, terms:'El publicador la identifica como dominio público. Confirma los derechos antes de reutilizarla.' };
  if (/\/(?:publicdomain\/zero|licenses\/zero)\//.test(url)) return { label:'CC0',url,terms:'Dedicación al dominio público declarada por el publicador.' };
  const type = url.match(/\/licenses\/([^/]+)\//)?.[1] || '';
  if (!type) return null;
  const conditions = [type.includes('by') ? 'reconocer la autoría' : '', type.includes('nc') ? 'uso no comercial' : '', type.includes('nd') ? 'no distribuir obras derivadas' : '', type.includes('sa') ? 'compartir adaptaciones bajo la misma licencia' : ''].filter(Boolean).join('; ');
  return { label:`CC ${type.toUpperCase()}`,url,terms:`Licencia declarada por quien subió el contenido: ${conditions || 'revisar condiciones en la fuente'}.` };
}
function safeIdentifier(id: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,110}$/.test(id)) throw new ApiError(400,'INVALID_IDENTIFIER','Identificador de Internet Archive inválido.');
  return id;
}
function fileUrl(id: string, filename: string): string {
  return `${BASE}/download/${encodeURIComponent(id)}/${filename.split('/').map(encodeURIComponent).join('/')}`;
}
function readLanguages(value: unknown): ('es'|'en')[] {
  const entries = Array.isArray(value) ? value : [value];
  const found = new Set<'es'|'en'>();
  for (const entry of entries) {
    if (typeof entry !== 'string') continue;
    const s = entry.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    // Campo del publicador; no confirma el idioma de cada pista de audio.
    if (/(^|[^a-z])(es|spa|spanish|espanol|castellano)([^a-z]|$)/.test(s)) found.add('es');
    if (/(^|[^a-z])(en|eng|english|ingles)([^a-z]|$)/.test(s)) found.add('en');
  }
  return [...found];
}
function filenameLanguage(fileName: string): 'es'|'en'|null {
  const s = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if (/(^|[._\s\-])(es|spa|spanish|espanol|castellano|latino)([._\s\-]|$)/.test(s)) return 'es';
  if (/(^|[._\s\-])(en|eng|english|ingles)([._\s\-]|$)/.test(s)) return 'en';
  return null;
}
function qualityOf(width: number | null,height: number | null): string {
  if (!height) return 'Resolución no indicada';
  if (height >= 2160 && width !== null && width >= 3840) return '4K (2160p)';
  if (height >= 2160) return `${height}p`;
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  return `${height}p`;
}
export function parseMetadata(identifier: string, raw: any): ArchiveItem | null {
  const meta = raw?.metadata;
  if (!meta || meta.is_dark === 'true' || meta.noindex === 'true' || meta.mediatype !== 'movies') return null;
  const license = licenseInfo(meta.licenseurl);
  if (!license) return null;
  const declaredLanguages = readLanguages(meta.language);
  const files: any[] = Array.isArray(raw.files) ? raw.files : [];
  const videos = files.filter(f => {
    const name = String(f.name || '');
    const size = Number(f.size || 0);
    return /\.(mp4|m4v|webm|ogv)$/i.test(name) && size >= 15_000_000 &&
      !/(sample|preview|trailer|thumb|clip)/i.test(name) && f.private !== 'true';
  });
  videos.sort((a,b) => {
    const aOriginal = a.source === 'original' ? 1 : 0;
    const bOriginal = b.source === 'original' ? 1 : 0;
    return bOriginal - aOriginal || Number(b.height||0) - Number(a.height||0) || Number(b.size) - Number(a.size);
  });
  if (!videos.length) return null;
  // Límite visible para no sobrecargar la UI con archivos de un mismo registro.
  const variants: ArchiveVariant[] = videos.slice(0,30).map((f,id) => {
    const height = Number(f.height||0)>0 ? Math.round(Number(f.height)) : null;
    const width = Number(f.width||0)>0 ? Math.round(Number(f.width)) : null;
    const name = String(f.name);
    const fromName = filenameLanguage(name);
    const language = fromName || (declaredLanguages.length===1 ? declaredLanguages[0] : null);
    return { id, fileName:name, fileSize:Number(f.size), fileFormat:String(f.format||name.split('.').at(-1)||'Video'),
      width,height,quality:qualityOf(width,height),language,languageSource:fromName?'archivo':language?'metadatos':null };
  });
  const first=variants[0];
  return {
    identifier, title:firstString(meta.title) || identifier, description:compactText(meta.description),
    creator:firstString(meta.creator),year:firstString(meta.year || meta.date).slice(0,4),
    image:`${BASE}/services/img/${encodeURIComponent(identifier)}`,
    sourceUrl:`${BASE}/details/${encodeURIComponent(identifier)}`,
    license, fileName:first.fileName,fileSize:first.fileSize,fileFormat:first.fileFormat,
    downloadUrl:null,downloadVerified:false,declaredLanguages,variants
  };
}
async function rawMetadata(identifier: string): Promise<ArchiveItem|null> {
  const id=safeIdentifier(identifier);
  return cached(`archive-meta:${id}`,60*60_000, async()=>{
    const raw=await getJson(new URL(`/metadata/${encodeURIComponent(id)}`,BASE),{},10500);
    return parseMetadata(id,raw);
  });
}
async function checkFile(identifier:string,fileName:string): Promise<boolean> {
  const url=fileUrl(identifier,fileName);
  try {
    const response=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(10000),redirect:'follow'});
    return response.ok && !response.headers.get('content-type')?.includes('text/html');
  } catch {return false;}
}
export async function archiveVariant(identifier:string,indexRaw:unknown) {
  const id=safeIdentifier(identifier);
  const item=await rawMetadata(id);
  if (!item) throw new ApiError(404,'NOT_LICENSED','No se encontró un video con licencia reconocible.');
  const index=Number(indexRaw);
  if (!Number.isSafeInteger(index)||index<0||index>=item.variants.length) throw new ApiError(404,'INVALID_VARIANT','La versión solicitada no existe.');
  const variant=item.variants[index];
  const verified=await cached(`archive-head:${id}:${variant.fileName}`,10*60_000,()=>checkFile(id,variant.fileName));
  return {id:variant.id,verified,downloadUrl:verified?fileUrl(id,variant.fileName):null};
}
export async function archiveDetail(identifier:string): Promise<ArchiveItem> {
  const item=await rawMetadata(identifier);
  if (!item) throw new ApiError(404,'NOT_LICENSED','No se encontró un archivo de video con una licencia pública reconocible para este elemento.');
  const result=await archiveVariant(item.identifier,0);
  return {...item,downloadVerified:result.verified,downloadUrl:result.downloadUrl};
}
export async function archiveSearch(query:string,pageRaw:unknown,languageRaw:unknown='all') {
  const page=pageParam(pageRaw,75);
  const language=['es','en'].includes(String(languageRaw)) ? String(languageRaw) : 'all';
  const clean=textParam(query,75).replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim();
  const url=new URL('/advancedsearch.php',BASE);
  const expression='mediatype:movies AND (licenseurl:http*by* OR licenseurl:http*zero* OR licenseurl:http*publicdomain*)';
  const safeQuery=clean?`${expression} AND title:(${clean.split(' ').slice(0,6).join(' AND ')})`:expression;
  url.searchParams.set('q',safeQuery);
  ['identifier','title','year','creator','language'].forEach(x=>url.searchParams.append('fl[]',x));
  url.searchParams.set('rows','24');
  url.searchParams.set('page',String(page));
  url.searchParams.set('output','json');
  url.searchParams.append('sort[]','downloads desc');
  const catalog=await cached(`archive-search:${url.search}`,8*60_000,()=>getJson(url,{},14000));
  const docs=Array.isArray(catalog?.response?.docs)?catalog.response.docs:[];
  const records:PromiseSettledResult<ArchiveItem|null>[] = new Array(docs.length);
  let cursor=0;
  await Promise.all(Array.from({length:Math.min(6,docs.length)},async()=>{
    while(cursor<docs.length){const current=cursor++;
      try{records[current]={status:'fulfilled',value:await rawMetadata(String(docs[current].identifier||''))};}
      catch(reason){records[current]={status:'rejected',reason};}
    }
  }));
  const found=records.filter((r):r is PromiseFulfilledResult<ArchiveItem|null>=>r.status==='fulfilled')
    .map(r=>r.value).filter((item):item is ArchiveItem=>Boolean(item));
  const results=language==='all'?[...found].sort((a,b)=>Number(b.declaredLanguages.includes('es')||b.variants.some(v=>v.language==='es'))-Number(a.declaredLanguages.includes('es')||a.variants.some(v=>v.language==='es'))):found.filter(item=>item.declaredLanguages.includes(language as 'es'|'en')||item.variants.some(v=>v.language===language));
  // Filtrar después de verificar los metadatos evita afirmar que un audio está en español solo por TMDB.
  return {page,results,hasMore:page*24<Number(catalog?.response?.numFound||0),
    notice:'El idioma aparece según los metadatos o el nombre del archivo. No verifica el audio. La calidad solo se indica si la fuente aporta las dimensiones reales.'};
}
