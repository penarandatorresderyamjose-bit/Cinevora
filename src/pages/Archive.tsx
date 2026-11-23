import {useEffect,useRef,useState} from 'react';
import {useSearchParams,Link,useParams} from 'react-router-dom';
import {ArrowLeft,ArrowRight,CheckCircle2,Download,ExternalLink,FileVideo,Info,Search,ShieldCheck,HardDrive,PlayCircle,Languages,MonitorPlay} from 'lucide-react';
import {getArchive,getArchiveItem,getArchiveVariant} from '../lib/api';
import {EmptyState,ErrorState,Loading} from '../components/States';
import type {ArchiveMovie,ArchiveVariant} from '../types';
const sizeOf=(bytes:number)=>bytes>=1e9?`${(bytes/1e9).toFixed(2)} GB`:`${(bytes/1e6).toFixed(0)} MB`;
const languageName=(lang:'es'|'en'|null)=>lang==='es'?'Español':lang==='en'?'Inglés':'No especificado';
function ArchivePoster({item}:{item:ArchiveMovie}){return <div className="archive-thumb"><img loading="lazy" src={item.image} alt={`Carátula de ${item.title}`} onError={e=>{e.currentTarget.style.display='none'}}/><FileVideo size={38} className="archive-fallback"/></div>}
export function Archive(){
 const [params,setParams]=useSearchParams();const q=params.get('q')||'';const lang=['es','en'].includes(params.get('lang')||'')?params.get('lang')!:'all';
 const [query,setQuery]=useState(q);const [items,setItems]=useState<ArchiveMovie[]>([]);const [page,setPage]=useState(1);
 const [more,setMore]=useState(false);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [reload,setReload]=useState(0);
 useEffect(()=>setQuery(q),[q]);
 useEffect(()=>{const ctrl=new AbortController();setLoading(true);setError('');setItems([]);setPage(1);
  getArchive(q,1,lang,ctrl.signal).then(data=>{setItems(data.results);setMore(data.hasMore)}).catch(e=>{if(!ctrl.signal.aborted)setError(e.message)})
   .finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});return()=>ctrl.abort();
 },[q,lang,reload]);
 const changeSearch=(text:string,language:string)=>setParams({...(text.trim()?{q:text.trim()}:{}),...(language!=='all'?{lang:language}:{})});
 const search=(e:React.FormEvent)=>{e.preventDefault();changeSearch(query,lang)};
 const moreItems=async()=>{setLoading(true);setError('');try{const next=page+1;const data=await getArchive(q,next,lang);setItems(curr=>[...curr,...data.results.filter(i=>!curr.some(x=>x.identifier===i.identifier))]);setMore(data.hasMore);setPage(next)}catch(e){setError(e instanceof Error?e.message:'Error al cargar.')}finally{setLoading(false)}};
 return <div className="container-page content-page"><div className="page-heading"><p className="eyebrow">PELÍCULAS Y VIDEOS CON LICENCIA DECLARADA</p><h1>Ver y descargar legalmente<span className="pink-dot">.</span></h1><p>Elige entre las versiones publicadas en Internet Archive. Si existe una versión en español, 1080p o 4K, podrás seleccionarla sin que CINEVORA añada anuncios.</p></div>
  <div className="archive-intro"><ShieldCheck size={24} className="text-accent"/><div><strong>Reproductor propio, sin anuncios añadidos</strong><p>Solo reproducimos los archivos originales del proveedor mediante el reproductor del navegador. El audio y la resolución dependen del archivo real. El idioma declarado no garantiza un doblaje; revisa la ficha y la licencia de la fuente.</p></div></div>
  <form className="archive-search" onSubmit={search}><Search size={19}/><input placeholder="Buscar por título en Internet Archive..." aria-label="Buscar en Internet Archive" value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit" className="btn btn-primary">Buscar</button></form>
  <div className="archive-preferences"><label htmlFor="archive-language"><Languages size={18}/> Idioma del archivo (según metadatos)</label><select id="archive-language" value={lang} onChange={e=>changeSearch(q,e.target.value)}><option value="all">Todos los idiomas</option><option value="es">Español declarado</option><option value="en">Inglés declarado</option></select><p>El filtro utiliza el idioma indicado por quien subió el archivo o su nombre. No analiza las pistas de audio. Puede haber pocos resultados en español por página.</p></div>
  <div className="results-heading"><div><p className="eyebrow">BIBLIOTECA ABIERTA</p><h2>Archivos con licencia</h2></div><span className="source-badge"><span/> Internet Archive</span></div>
  {error&&<ErrorState message={error} onRetry={()=>setReload(r=>r+1)}/>}
  {loading&&items.length===0&&<Loading label="Consultando licencias y versiones en Internet Archive..."/>}
  {items.length>0&&<div className="archive-grid">{items.map(item=><article className="archive-card" key={item.identifier}><Link to={`/archivo/${encodeURIComponent(item.identifier)}`}><ArchivePoster item={item}/></Link>
    <div className="archive-card-body"><span className="legal-tag"><ShieldCheck size={13}/>{item.license.label}</span><h3><Link to={`/archivo/${encodeURIComponent(item.identifier)}`}>{item.title}</Link></h3><p>{item.year||'Sin año indicado'}{item.creator&&` · ${item.creator}`}</p>
    <div className="archive-quick-info"><span><Languages size={12}/>{item.declaredLanguages.length?item.declaredLanguages.map(languageName).join(' / '):'Idioma no indicado'}</span><span><MonitorPlay size={12}/>{item.variants.some(v=>v.height)?item.variants.find(v=>v.height)?.quality:'Sin resolución indicada'}</span></div>
    <div className="archive-card-actions"><span><HardDrive size={13}/>{sizeOf(item.fileSize)}</span><Link to={`/archivo/${encodeURIComponent(item.identifier)}`} className="btn btn-small">Ver versiones <ArrowRight size={15}/></Link></div></div>
   </article>)}</div>}
  {!loading&&!error&&items.length===0&&<EmptyState title="No se encontraron archivos en esta página" text="Prueba otro título, cambia el idioma o carga otra página. El catálogo solo muestra material con licencia indicada por el publicador."/>}
  {more&&<div className="load-more-wrap"><button disabled={loading} onClick={moreItems} className="btn btn-secondary">{loading?'Consultando archivos...':'Ver más archivos'}<ArrowRight size={16}/></button></div>}
  <p className="filter-disclaimer">Los permisos e idiomas se basan en los datos declarados por terceros y pueden ser inexactos. Una licencia pública declarada no prueba por sí sola que quien la publicó tuviera los derechos.</p>
 </div>;
}
export function ArchiveDetail(){
 const {identifier=''}=useParams();const [item,setItem]=useState<ArchiveMovie|null>(null);
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [reload,setReload]=useState(0);
 const [language,setLanguage]=useState('all');const [variantId,setVariantId]=useState(0);
 const [readyUrl,setReadyUrl]=useState<string|null>(null);const [checking,setChecking]=useState(false);const [status,setStatus]=useState('');
 const requestCount=useRef(0);
 useEffect(()=>{const ctrl=new AbortController();requestCount.current++;setLoading(true);setError('');setItem(null);setReadyUrl(null);
  getArchiveItem(identifier,ctrl.signal).then(result=>{setItem(result);setVariantId(0);setLanguage('all');setReadyUrl(result.downloadVerified?result.downloadUrl:null);
    setStatus(result.downloadVerified?'Archivo original disponible para reproducir.':'No se pudo verificar el primer archivo. Puedes probar otra versión.');})
   .catch(e=>{if(!ctrl.signal.aborted)setError(e.message)}).finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});
  return()=>{ctrl.abort();requestCount.current++};
 },[identifier,reload]);
 const chooseVariant=async(id:number)=>{
  if(!item)return;
  const thisRequest=++requestCount.current;setVariantId(id);setReadyUrl(null);setChecking(true);setStatus('Comprobando esta versión con la fuente...');
  try{const checked=await getArchiveVariant(item.identifier,id);
   if(thisRequest!==requestCount.current)return;
   if(checked.verified&&checked.downloadUrl){setReadyUrl(checked.downloadUrl);setStatus('Archivo confirmado por la fuente. Puedes reproducirlo o descargarlo.');}
   else setStatus('Esta versión no respondió a la comprobación. Puedes consultar la página original.');
  }catch(e){if(thisRequest===requestCount.current)setStatus(e instanceof Error?e.message:'No se pudo comprobar el archivo.');}
  finally{if(thisRequest===requestCount.current)setChecking(false)}
 };
 const chooseLanguage=(value:string)=>{
  if(!item)return;setLanguage(value);
  const variant=item.variants.find(v=>value==='all'||v.language===value);
  if(variant){void chooseVariant(variant.id);}else{requestCount.current++;setReadyUrl(null);setChecking(false);setStatus(`La fuente no indica ninguna versión en ${value==='es'?'español':'inglés'} para este contenido.`)}
 };
 const visibleVariants=item?.variants.filter(v=>language==='all'||v.language===language)||[];
 const selected=item?.variants.find(v=>v.id===variantId);
 return <div className="container-page content-page"><Link to="/descargas" className="back-link"><ArrowLeft size={17}/> Regresar a descargas legales</Link>
  {loading&&<Loading label="Verificando licencia y versiones disponibles..."/>}
  {error&&<ErrorState message={error} onRetry={()=>setReload(v=>v+1)}/>}
  {item&&<div className="archive-detail"><div className="archive-detail-poster"><ArchivePoster item={item}/></div><div className="archive-detail-copy"><span className="eyebrow">FICHA DEL ARCHIVO</span><h1>{item.title}</h1><span className="legal-tag large"><ShieldCheck size={17}/>{item.license.label}</span>
  <p className="archive-description">{item.description || 'La fuente no proporciona una descripción detallada de este contenido.'}</p>
  <div className="archive-facts"><div><span>Año indicado</span><strong>{item.year||'No informado'}</strong></div><div><span>Publicador / creador</span><strong>{item.creator||'No indicado'}</strong></div><div><span>Versiones de video</span><strong>{item.variants.length}</strong></div><div><span>Idiomas declarados</span><strong>{item.declaredLanguages.length?item.declaredLanguages.map(languageName).join(', '):'No informados'}</strong></div><div><span>Fuente</span><strong>Internet Archive</strong></div></div>
  <section className="watch-panel" aria-label="Opciones de reproducción y descarga"><h2><PlayCircle size={23}/> Ver o descargar</h2><p>Selecciona el idioma indicado y la resolución disponible. La página no convierte audio ni mejora artificialmente la calidad.</p>
   <div className="watch-controls"><label>Idioma declarado<select value={language} onChange={e=>chooseLanguage(e.target.value)}><option value="all">Todas las versiones</option><option value="es">Español</option><option value="en">Inglés</option></select></label>
   <label>Archivo y calidad<select value={visibleVariants.some(v=>v.id===variantId)?variantId:''} disabled={!visibleVariants.length||checking} onChange={e=>void chooseVariant(Number(e.target.value))}>
    {!visibleVariants.length&&<option value="">Sin versiones para este idioma</option>}
    {visibleVariants.map((v:ArchiveVariant)=><option key={v.id} value={v.id}>{v.quality} · {languageName(v.language)} · {sizeOf(v.fileSize)}</option>)}
   </select></label></div>
   {selected&&visibleVariants.some(v=>v.id===selected.id)&&<p className="variant-description">{selected.width&&selected.height?`Resolución indicada: ${selected.width} × ${selected.height} píxeles.`:'La fuente no informa la resolución de este archivo.'} Idioma: {languageName(selected.language)}{selected.languageSource?` (según ${selected.languageSource==='archivo'?'el nombre del archivo':'los metadatos'}).`:'.'} <strong>No es una verificación técnica del audio.</strong></p>}
   <div className="archive-download-status" role="status" aria-live="polite">{readyUrl?<CheckCircle2 size={19}/>:<Info size={19}/>} {checking?'Comprobando disponibilidad...':status}</div>
   {readyUrl&&<><div className="native-video-wrap"><video key={readyUrl} controls playsInline preload="metadata" src={readyUrl} poster={item.image} aria-label={`Reproductor de ${item.title}`}>Tu navegador no admite la reproducción de este formato. Puedes descargarlo desde la fuente.</video></div>
    <p className="player-notice">Sin anuncios insertados por CINEVORA. El video se transmite desde Internet Archive. Algunos formatos pueden no funcionar en todos los navegadores; usa la descarga o visita la fuente.</p>
    <a href={readyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><Download size={18}/> Descargar esta versión ({selected?.quality})</a></>}
   {!readyUrl&&<p className="player-notice">No hay un enlace confirmado para la selección actual. El enlace original sigue disponible.</p>}
  </section>
  <div className="license-box"><div className="license-box-title"><Info size={18}/><strong>Condiciones de uso</strong></div><p>{item.license.terms} La licencia es información aportada por quien publicó el archivo; comprueba los derechos de la obra.</p><a href={item.license.url} target="_blank" rel="noopener noreferrer">Consultar licencia <ExternalLink size={14}/></a></div>
  <div className="detail-buttons"><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary"><ExternalLink size={17}/> Ver en Internet Archive</a></div>
  <p className="legal-caution">No se pueden agregar voces en español, 1080p o 4K cuando la fuente no las proporciona. CINEVORA no aloja videos ni controla los anuncios de sitios externos.</p>
  </div></div>}
 </div>;
}
