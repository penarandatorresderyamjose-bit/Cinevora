import {useEffect,useState} from 'react';
import {ArrowRight,Bookmark,Film,Play,Search,Star} from 'lucide-react';
import {Link,useNavigate} from 'react-router-dom';
import type {Movie,MoviePage} from '../types';
import {getApi,img,stars,yearOf} from '../lib/api';
import {useApp} from '../context/AppContext';
import {MovieRail} from '../components/MovieRail';
import {ErrorState,Loading} from '../components/States';
import {categories} from '../data/categories';
const sections:[string,string,string,string][] = [
 ['trending','En tendencia','LO QUE TODOS ESTÁN VIENDO','tendencias'],
 ['popular','Las más populares','SELECCIÓN DEL MOMENTO','populares'],
 ['now','En cartelera','AHORA EN CINES','estrenos'],
 ['top','Mejor valoradas','FAVORITAS DEL PÚBLICO','mejor-valoradas'],
 ['recent','Lanzamientos recientes','LO ÚLTIMO EN CINE','recientes'],
 ['upcoming','Próximos estrenos','MUY PRONTO','proximamente'],
];
export function Home(){
 const [data,setData] = useState<Record<string,MoviePage>>({});const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [reload,setReload]=useState(0);
 const [recommendations,setRecommendations]=useState<Movie[]>([]);
 const [slide,setSlide]=useState(0);const {favorites,toggleFavorite,isFavorite}=useApp();const navigate=useNavigate();
 useEffect(()=>{const ctrl=new AbortController();setLoading(true);setError('');getApi<{feeds:Record<string,MoviePage>}>('/home',ctrl.signal)
 .then(r=>{setData(r.feeds);setSlide(0)}).catch(e=>{if(!ctrl.signal.aborted)setError(e.message)}).finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});
 return()=>ctrl.abort()},[reload]);
 const heroMovies=(data.trending?.results||data.popular?.results||[]).filter(x=>x.backdrop_path).slice(0,5);
 const hero=heroMovies[slide];
 const recommendedGenre = favorites.length ? recommendations : (data.top?.results||[]).slice(4,18);
 const favIds = favorites.slice(0,3).map(x=>x.id).join(',');
 useEffect(()=>{if(!favIds){setRecommendations([]);return;}const ctrl=new AbortController();
 getApi<MoviePage>(`/recommendations?ids=${favIds}`,ctrl.signal).then(d=>setRecommendations(d.results)).catch(()=>setRecommendations([]));
 return()=>ctrl.abort();},[favIds]);
 return <>
   {hero?<section className="hero" aria-label="Película destacada">
    <div className="hero-background" style={{backgroundImage:`linear-gradient(90deg, #090a10 4%,rgba(9,10,16,.9) 28%,rgba(9,10,16,.35) 80%),linear-gradient(0deg,#090a10 0%,transparent 35%),url('${img(hero.backdrop_path,'w1280')}')`}}/>
    <div className="container-page hero-inner"><div className="hero-copy">
     <span className="hero-badge"><span className="pulse-dot"/> ESTRELLA DE LA SEMANA</span>
     <h1>{hero.title}</h1>
     <div className="hero-meta"><span><Star size={17} fill="currentColor"/> {stars(hero.vote_average)}</span><span>{yearOf(hero.release_date)}</span><span>Película</span></div>
     <p>{hero.overview || 'Descubre esta película y conoce su historia, reparto y más información.'}</p>
     <div className="hero-buttons"><Link className="btn btn-primary" to={`/pelicula/${hero.id}`}><Play size={17} fill="currentColor"/> Explorar película</Link>
      <button className="btn btn-ghost" onClick={()=>toggleFavorite(hero)}><Bookmark size={17} fill={isFavorite(hero.id)?'currentColor':'none'}/>{isFavorite(hero.id)?'Guardada':'Mi lista'}</button></div>
    </div>
    <div className="hero-pagination" role="group" aria-label="Cambiar película destacada">{heroMovies.map((m,i)=><button key={m.id} onClick={()=>setSlide(i)} className={slide===i?'active':''} aria-label={`Mostrar ${m.title}`} aria-pressed={slide===i}/>)}</div>
    </div>
   </section> : <section className="hero hero-placeholder"><div className="container-page hero-inner"><div className="hero-copy"><span className="hero-badge">✦ DESCUBRE NUEVAS HISTORIAS</span><h1>El cine empieza <em>aquí.</em></h1><p>Explora miles de películas, conoce sus historias y guarda lo que quieras ver. También puedes buscar películas con descargas autorizadas.</p><div className="hero-buttons"><Link to="/explorar" className="btn btn-primary"><Search size={17}/> Buscar películas</Link><Link to="/descargas" className="btn btn-ghost"><Film size={17}/> Descargas legales</Link></div></div></div></section>}
   <div className="container-page home-content">
    {error&&<ErrorState message={error} onRetry={()=>setReload(x=>x+1)}/>}
    {loading&&<div className="home-loading"><Loading label="Preparando tu cartelera..."/></div>}
    {!loading&&sections.map(([key,title,eyebrow,feed])=><MovieRail key={key} title={title} eyebrow={eyebrow} movies={data[key]?.results||[]} to={`/explorar?seccion=${feed}`}/>)}
    {recommendedGenre.length>0&&<MovieRail title={favorites.length?"Recomendadas para ti":"Nuestras sugerencias"} eyebrow="RECOMENDACIONES" movies={recommendedGenre.slice(0,14)} to="/explorar"/>}
    <section className="category-section"><div className="section-top"><div><p className="eyebrow">UN GÉNERO PARA CADA MOMENTO</p><h2 className="section-title">Explora por género</h2></div><Link to="/categorias" className="see-all">Todos los géneros <ArrowRight size={16}/></Link></div>
      <div className="genre-teasers">{categories.slice(0,8).map(([slug,title,emoji])=><Link to={`/genero/${slug}`} className="genre-teaser" key={slug}><span>{emoji}</span><strong>{title}</strong><ArrowRight size={17}/></Link>)}</div>
    </section>
    <section className="download-banner"><div><span className="eyebrow">CINE CON FUENTES AUTORIZADAS</span><h2>Descubre películas que puedes descargar legalmente.</h2><p>Consulta videos en español cuando la fuente los declara, elige la calidad real disponible y reproduce sin anuncios añadidos por CINEVORA.</p><Link to="/descargas" className="btn btn-primary">Ver biblioteca de descargas <ArrowRight size={17}/></Link></div><span className="banner-ornament" aria-hidden="true">◈</span></section>
   </div>
 </>;
}
