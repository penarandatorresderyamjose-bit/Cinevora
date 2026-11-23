import {Heart,Star} from 'lucide-react';
import {Link} from 'react-router-dom';
import {img,stars,yearOf} from '../lib/api';
import {useApp} from '../context/AppContext';
import type {Movie} from '../types';
export function Poster({path,title,wide=false}:{path?:string|null;title:string;wide?:boolean}) {
 return <div className={`poster-visual ${!path?'no-poster':''} ${wide?'wide':''}`}>
   {path ? <img loading="lazy" alt={`Póster de ${title}`} src={img(path,wide?'w780':'w342')} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement?.classList.add('no-poster')}}/> : null}
   <div className="poster-fallback" aria-hidden="true"><span>◈</span><small>Imagen no disponible</small></div>
 </div>;
}
export function MovieCard({movie}:{movie:Movie}) {
 const {isFavorite,toggleFavorite} = useApp();const saved=isFavorite(movie.id);
 return <article className="movie-card">
  <Link className="movie-poster-link" to={`/pelicula/${movie.id}`} aria-label={`Ver detalles de ${movie.title}`}>
   <Poster path={movie.poster_path} title={movie.title}/>
   <span className="card-rating"><Star size={12} fill="currentColor"/>{stars(movie.vote_average)}</span>
   <span className="card-overlay">Ver detalles</span>
  </Link>
  <button className={`favorite-btn ${saved?'active':''}`} title={saved?'Quitar de favoritos':'Añadir a favoritos'} aria-label={saved?`Quitar ${movie.title} de favoritos`:`Guardar ${movie.title} en favoritos`} onClick={()=>toggleFavorite(movie)}><Heart size={17} fill={saved?'currentColor':'none'}/></button>
  <Link to={`/pelicula/${movie.id}`} className="card-title" title={movie.title}>{movie.title}</Link>
  <p className="card-subtitle">{yearOf(movie.release_date)} <span>•</span> Película</p>
 </article>;
}
