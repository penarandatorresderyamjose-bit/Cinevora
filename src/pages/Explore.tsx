import {useCallback,useEffect,useMemo,useState} from 'react';
import {Search,SlidersHorizontal,RotateCcw,ArrowRight,Filter} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';
import {getFeed,getSearch} from '../lib/api';
import {genres,languages,countries} from '../data/categories';
import type {Movie,MoviePage} from '../types';
import {MovieCard} from '../components/MovieCard';
import {EmptyState,ErrorState,Loading} from '../components/States';
const names:Record<string,{feed:string;title:string}> = {
 tendencias:{feed:'trending',title:'En tendencia'},populares:{feed:'popular',title:'Películas populares'},
 estrenos:{feed:'now',title:'En cartelera'},'mejor-valoradas':{feed:'top',title:'Mejor valoradas'},
 recientes:{feed:'recent',title:'Lanzamientos recientes'},proximamente:{feed:'upcoming',title:'Próximos estrenos'}
};
const empty = {q:'',genre:'',year:'',actor:'',director:'',country:'',language:'',sort:'popularity.desc'};
type FilterState = typeof empty;
function queryToFilters(p:URLSearchParams):FilterState {const next={...empty};for(const key of Object.keys(empty) as (keyof FilterState)[]){const val=p.get(key);if(val)next[key]=val;}return next;}
export function Explore(){
 const [params,setParams]=useSearchParams();const [filters,setFilters]=useState<FilterState>(()=>queryToFilters(params));
 const [results,setResults]=useState<Movie[]>([]);const [page,setPage]=useState(1);
 const [more,setMore]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const [reload,setReload]=useState(0);const [showFilters,setShowFilters]=useState(false);
 const section=params.get('seccion') || '';const sectionInfo=names[section];
 const filtersKey=params.toString();
 useEffect(()=>{setFilters(queryToFilters(params));},[filtersKey]);
 const commit=useCallback((next:FilterState)=>{setFilters(next);const obj:Record<string,string>={};Object.entries(next).forEach(([k,v])=>{if(v&&!(k==='sort'&&v==='popularity.desc'))obj[k]=v});setParams(obj,{replace:true});setPage(1)},[setParams]);
 useEffect(()=>{
  const ctrl=new AbortController();setLoading(true);setError('');setResults([]);setMore(false);setPage(1);
  const promise = sectionInfo ? getFeed(sectionInfo.feed,1,ctrl.signal) : getSearch({...queryToFilters(params),page:1},ctrl.signal);
  promise.then((data:MoviePage)=>{if(!ctrl.signal.aborted){setResults(data.results);setMore(data.page<data.total_pages)}})
   .catch(e=>{if(!ctrl.signal.aborted)setError(e.message)}).finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});
  return ()=>ctrl.abort();
 },[filtersKey,reload]);
 const loadMore=async()=>{
  if(loading||!more)return;setLoading(true);setError('');const next=page+1;
  try {const data=sectionInfo ? await getFeed(sectionInfo.feed,next):await getSearch({...queryToFilters(params),page:next});
   setResults(curr=>[...curr,...data.results.filter(m=>!curr.some(c=>c.id===m.id))]);setPage(next);setMore(data.page<data.total_pages);
  }catch(e){setError(e instanceof Error?e.message:'No fue posible cargar más películas.')}finally{setLoading(false)}
 };
 const typed=(field:keyof FilterState,value:string)=>{const next={...filters,[field]:value};setFilters(next);
  if(field==='q')window.clearTimeout((window as any).__cinevoraSearchTimer);
  if(field==='q') (window as any).__cinevoraSearchTimer=window.setTimeout(()=>commit(next),480);
 };
 const search=(e:React.FormEvent)=>{e.preventDefault();commit(filters)};
 const count = useMemo(()=>Object.entries(filters).filter(([k,v])=> k!=='q'&&k!=='sort'&&v).length,[filters]);
 return <div className="container-page content-page">
  <div className="page-heading"><span className="eyebrow">EL CATÁLOGO A TU MEDIDA</span><h1>{sectionInfo?.title||'Explora películas'}<span className="pink-dot">.</span></h1><p>Descubre películas por título, persona, género, año, país o idioma original.</p></div>
  <form className="filters-panel" onSubmit={search}>
   <div className="filter-main"><label className="field-search"><Search size={20}/><input placeholder="Escribe el nombre de una película..." aria-label="Título de la película" value={filters.q} onChange={e=>typed('q',e.target.value)}/></label>
    <button type="button" onClick={()=>setShowFilters(x=>!x)} className="btn btn-secondary filters-toggle"><Filter size={17}/> Filtros {count>0&&<span className="filter-count">{count}</span>}</button>
    <button className="btn btn-primary filter-search-button" type="submit"><Search size={17}/> Buscar</button>
   </div>
   <div className={`advanced-filters ${showFilters?'expanded':''}`}>
    <div className="filter-grid">
     <label className="field-label">Género<select value={filters.genre} onChange={e=>typed('genre',e.target.value)}><option value="">Todos los géneros</option>{genres.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
     <label className="field-label">Año<input type="number" value={filters.year} onChange={e=>typed('year',e.target.value.slice(0,4))} placeholder="Ej. 2024" min={1880} max={new Date().getFullYear()+5}/></label>
     <label className="field-label">Actor o actriz<input value={filters.actor} onChange={e=>typed('actor',e.target.value)} placeholder="Nombre del intérprete"/></label>
     <label className="field-label">Director/a<input value={filters.director} onChange={e=>typed('director',e.target.value)} placeholder="Nombre del director"/></label>
     <label className="field-label">País<select value={filters.country} onChange={e=>typed('country',e.target.value)}>{countries.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
     <label className="field-label">Idioma original<select value={filters.language} onChange={e=>typed('language',e.target.value)}>{languages.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    </div>
    <div className="filter-footer"><p>El idioma corresponde al idioma original registrado por TMDB.</p><button type="button" className="clear-filter" onClick={()=>{commit(empty);setShowFilters(false)}}><RotateCcw size={14}/> Limpiar filtros</button></div>
   </div>
  </form>
  <div className="results-heading"><div><span className="eyebrow">RESULTADOS REALES DE TMDB</span><h2>Películas encontradas</h2></div><label className="sort-label"><SlidersHorizontal size={16}/><select aria-label="Ordenar por" value={filters.sort} onChange={e=>commit({...filters,sort:e.target.value})}><option value="popularity.desc">Más populares</option><option value="primary_release_date.desc">Más recientes</option><option value="vote_average.desc">Mejor calificadas</option></select></label></div>
  {error&&<ErrorState message={error} onRetry={()=>setReload(x=>x+1)}/>}
  {results.length>0&&<div className="poster-grid">{results.map(m=><MovieCard movie={m} key={m.id}/>)}</div>}
  {loading&&results.length===0&&<Loading cards/>}
  {!loading&&!error&&results.length===0&&<EmptyState title="No hubo resultados" text="Cambia el título o prueba con filtros menos específicos."/>}
  {results.length>0&&more&&<div className="load-more-wrap"><button className="btn btn-secondary" onClick={loadMore} disabled={loading}>{loading?'Cargando...':<>Cargar más películas <ArrowRight size={16}/></>}</button></div>}
  {results.length>0&&!loading&&!more&&<p className="end-list">Has llegado al final de los resultados disponibles.</p>}
  {!sectionInfo&&filters.q&&<p className="filter-disclaimer">Con una búsqueda por título, los filtros adicionales se aplican a los resultados de cada página. Puede haber más coincidencias en otras páginas.</p>}
 </div>;
}
