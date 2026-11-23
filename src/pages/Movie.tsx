import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,Calendar,Clock,Download,ExternalLink,Heart,Languages,Play,Star,UserRound,X} from 'lucide-react';
import {Link,useParams} from 'react-router-dom';
import {getMovie,img,stars,yearOf} from '../lib/api';
import {useApp} from '../context/AppContext';
import {MovieRail} from '../components/MovieRail';
import {Poster} from '../components/MovieCard';
import {ErrorState,Loading} from '../components/States';
import type {MovieDetails} from '../types';
export function MoviePage(){
 const {id=''}=useParams();const [movie,setMovie]=useState<MovieDetails|null>(null);
 const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [trailer,setTrailer]=useState<string|null>(null);const [reload,setReload]=useState(0);
 const {recordVisit,isFavorite,toggleFavorite}=useApp();
 useEffect(()=>{const ctrl=new AbortController();setLoading(true);setError('');setMovie(null);
  getMovie(id,ctrl.signal).then(data=>{setMovie(data);recordVisit(data)}).catch(e=>{if(!ctrl.signal.aborted)setError(e.message)})
  .finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});return()=>ctrl.abort();
 },[id,reload,recordVisit]);
 useEffect(()=>{setTrailer(null)},[id]);
 useEffect(()=>{if(!trailer)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setTrailer(null)};window.addEventListener('keydown',key);document.body.style.overflow='hidden';return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=''}},[trailer]);
 const director=movie?.directors?.map(x=>x.name).join(', ')||'Sin datos';
 return <>
  {loading&&<div className="container-page content-page"><Loading label="Cargando ficha de la película..."/></div>}
  {error&&<div className="container-page content-page"><ErrorState message={error} onRetry={()=>setReload(x=>x+1)}/></div>}
  {movie&&<>
   <section className="detail-hero"><div className="detail-backdrop" style={{backgroundImage:movie.backdrop_path?`linear-gradient(0deg,#090a10 3%,rgba(9,10,16,.53) 90%),linear-gradient(90deg,#090a10 4%,rgba(9,10,16,.28)),url('${img(movie.backdrop_path,'w1280')}')`:undefined}}/>
    <div className="container-page detail-content"><Link to="/explorar" className="back-link"><ArrowLeft size={17}/> Volver a explorar</Link>
     <div className="detail-main"><div className="detail-poster"><Poster path={movie.poster_path} title={movie.title}/></div>
      <div className="detail-description"><p className="eyebrow">DESCUBRE LA HISTORIA</p><h1>{movie.title}</h1>{movie.tagline&&<p className="tagline">{movie.tagline}</p>}
       <div className="detail-meta"><span className="rating-pill"><Star size={17} fill="currentColor"/>{stars(movie.vote_average)} <small>/ 10</small></span>
       <span><Calendar size={16}/>{yearOf(movie.release_date)}</span>{movie.runtime&&<span><Clock size={16}/>{Math.floor(movie.runtime/60)}h {movie.runtime%60}m</span>}
       {movie.spoken_languages?.[0]&&<span><Languages size={16}/>{movie.spoken_languages[0].name || movie.spoken_languages[0].english_name}</span>}</div>
       <div className="genre-pills">{(movie.genres||[]).map(g=><Link key={g.id} to={`/explorar?genre=${g.id}`} className="genre-pill">{g.name}</Link>)}</div>
       <h2>Sinopsis</h2><p className="movie-overview">{movie.overview||'La sinopsis todavía no está disponible en español.'}</p>
       <div className="detail-buttons">
        {movie.trailers.length>0&&<button className="btn btn-primary" onClick={()=>setTrailer(movie.trailers[0].key)}><Play size={18} fill="currentColor"/> Ver tráiler</button>}
        <button className="btn btn-secondary" onClick={()=>toggleFavorite(movie)}><Heart size={18} fill={isFavorite(movie.id)?'currentColor':'none'}/>{isFavorite(movie.id)?'Quitar de favoritos':'Añadir a mi lista'}</button>
        <Link className="btn btn-ghost" to={`/descargas?q=${encodeURIComponent(movie.title)}&lang=es`} title="Buscar archivos con idioma español declarado. No implica que esta película esté disponible ni verifica el doblaje."><Download size={17}/> Buscar versión en español</Link>
       </div>
       <p className="legal-caution">La búsqueda en el archivo no garantiza que esta misma película esté disponible para descargar.</p>
      </div></div>
    </div>
   </section>
   <div className="container-page detail-extra">
    <div className="facts-card"><div><span>Dirección</span><strong>{director}</strong></div><div><span>Estreno</span><strong>{movie.release_date||'Sin datos'}</strong></div><div><span>Países de producción</span><strong>{movie.production_countries?.map(c=>c.name).join(', ')||'Sin datos'}</strong></div><div><span>Idiomas hablados</span><strong>{movie.spoken_languages?.map(l=>l.name||l.english_name).join(', ')||'Sin datos'}</strong></div>
      <div><span>Título original</span><strong>{movie.original_title||movie.title}</strong></div><div><span>Calificación TMDB</span><strong>{stars(movie.vote_average)} / 10 {movie.vote_count?`(${movie.vote_count.toLocaleString('es-CO')} votos)`:''}</strong></div>
    </div>
    {movie.cast.length>0&&<section className="detail-section"><div className="section-top"><div><p className="eyebrow">QUIÉNES LE DAN VIDA</p><h2 className="section-title">Reparto principal</h2></div></div><div className="cast-grid">{movie.cast.map(actor=><div key={actor.id} className="cast-card"><div className="cast-photo">{actor.profile_path?<img loading="lazy" src={img(actor.profile_path,'w342')} alt={`Foto de ${actor.name}`} onError={e=>{e.currentTarget.style.display='none'}}/>:<UserRound size={32}/>}</div><strong>{actor.name}</strong><small>{actor.character || 'Reparto'}</small></div>)}</div></section>}
    {movie.trailers.length>0&&<section className="detail-section"><div className="section-top"><div><p className="eyebrow">MIRA UN ADELANTO</p><h2 className="section-title">Tráiler oficial disponible</h2></div></div><button className="trailer-preview" style={{backgroundImage:movie.backdrop_path?`linear-gradient(90deg,rgba(9,10,16,.78),rgba(9,10,16,.12)),url('${img(movie.backdrop_path,'w780')}')`:undefined}} onClick={()=>setTrailer(movie.trailers[0].key)}><span className="trailer-play"><Play fill="currentColor" size={25}/></span><span>Reproducir tráiler</span></button></section>}
    <MovieRail title="Películas similares" eyebrow="SI TE GUSTÓ ESTA HISTORIA" movies={movie.recommendations} to="/explorar"/>
    <div className="movie-data-footer"><a href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noopener noreferrer">Ver ficha original en TMDB <ExternalLink size={16}/></a></div>
   </div>
  </>}
  {trailer&&<div className="modal-layer" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setTrailer(null)}}><div className="video-modal" role="dialog" aria-modal="true" aria-label="Reproductor de tráiler"><div className="video-modal-title"><strong>Tráiler de {movie?.title}</strong><button onClick={()=>setTrailer(null)} aria-label="Cerrar tráiler"><X size={22}/></button></div><div className="video-ratio"><iframe src={`https://www.youtube-nocookie.com/embed/${trailer}?autoplay=1&rel=0`} title="Tráiler en YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div></div></div>}
 </>;
}
