import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,SlidersHorizontal} from 'lucide-react';
import {Link,useParams} from 'react-router-dom';
import {categories} from '../data/categories';
import {getApi} from '../lib/api';
import {MovieCard} from '../components/MovieCard';
import {EmptyState,ErrorState,Loading} from '../components/States';
import type {Movie,MoviePage} from '../types';
export function Categories(){return <div className="container-page content-page"><div className="page-heading"><p className="eyebrow">ENCUENTRA TU PRÓXIMA HISTORIA</p><h1>Todos los géneros<span className="pink-dot">.</span></h1><p>Desde la acción hasta los clásicos: cada sección consulta películas reales en TMDB.</p></div>
  <div className="all-genres">{categories.map(([slug,title,icon],i)=><Link key={slug} to={`/genero/${slug}`} className={`genre-tile genre-${i%5}`}><span className="genre-icon">{icon}</span><strong>{title}</strong><span>Explorar películas <ArrowRight size={15}/></span></Link>)}</div>
 </div>}
export function Category(){
 const {slug=''}=useParams();const entry=categories.find(x=>x[0]===slug);
 const [results,setResults]=useState<Movie[]>([]);const [page,setPage]=useState(1);const [more,setMore]=useState(false);
 const [sort,setSort]=useState('popularity.desc');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [reload,setReload]=useState(0);
 useEffect(()=>{const ctrl=new AbortController();setLoading(true);setError('');setResults([]);setPage(1);
  getApi<MoviePage>(`/category/${encodeURIComponent(slug)}?sort=${sort}&page=1`,ctrl.signal)
   .then(data=>{setResults(data.results);setMore(data.page<data.total_pages)}).catch(e=>{if(!ctrl.signal.aborted)setError(e.message)})
   .finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});
  return()=>ctrl.abort();
 },[slug,sort,reload]);
 const load=async()=>{setLoading(true);setError('');try{const next=page+1;const data=await getApi<MoviePage>(`/category/${slug}?sort=${sort}&page=${next}`);setResults(v=>[...v,...data.results]);setMore(next<data.total_pages);setPage(next)}catch(e){setError(e instanceof Error?e.message:'Error al cargar.')}finally{setLoading(false)}};
 if(!entry)return <div className="container-page content-page"><EmptyState title="Categoría no disponible"/><Link to="/categorias" className="btn btn-primary">Ver todas las categorías</Link></div>;
 return <div className="container-page content-page"><Link className="back-link" to="/categorias"><ArrowLeft size={17}/> Todos los géneros</Link>
  <div className="category-heading"><span className="category-emoji">{entry[2]}</span><div><p className="eyebrow">EXPLORAR POR GÉNERO</p><h1>{entry[1]}<span className="pink-dot">.</span></h1><p>Películas de esta categoría, seleccionadas a partir de los filtros y etiquetas de TMDB.</p></div></div>
  <div className="results-heading"><h2>Descubre películas</h2><label className="sort-label"><SlidersHorizontal size={17}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="popularity.desc">Más populares</option><option value="primary_release_date.desc">Más recientes</option><option value="vote_average.desc">Mejor calificadas</option></select></label></div>
  {error&&<ErrorState message={error} onRetry={()=>setReload(v=>v+1)}/>}
  {results.length>0&&<div className="poster-grid">{results.map(m=><MovieCard key={m.id} movie={m}/>)}</div>}
  {loading&&results.length===0&&<Loading cards/>}
  {!loading&&!error&&results.length===0&&<EmptyState title="Sin coincidencias por ahora" text="TMDB todavía no devuelve películas con las etiquetas de esta categoría. Prueba otra."/>}
  {more&&results.length>0&&<div className="load-more-wrap"><button disabled={loading} className="btn btn-secondary" onClick={load}>{loading?'Cargando...':'Ver más películas'}<ArrowRight size={16}/></button></div>}
 </div>;
}
