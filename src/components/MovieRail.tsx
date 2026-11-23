import {useRef} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {Movie} from '../types';
import {MovieCard} from './MovieCard';
export function MovieRail({title,eyebrow,movies,to}:{title:string;eyebrow?:string;movies:Movie[];to?:string}){
 const rail=useRef<HTMLDivElement>(null);
 if(!movies.length)return null;
 const scroll=(dir:number)=>rail.current?.scrollBy({left:dir*(rail.current?.clientWidth||700)*0.8,behavior:'smooth'});
 return <section className="rail-section">
  <div className="section-top"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h2 className="section-title">{title}</h2></div>
   <div className="flex items-center gap-2">{to&&<Link to={to} className="see-all">Ver todas <ArrowRight size={15}/></Link>}
    <button className="rail-arrow hidden sm:grid" aria-label={`Desplazar ${title} a la izquierda`} onClick={()=>scroll(-1)}><ChevronLeft size={19}/></button>
    <button className="rail-arrow hidden sm:grid" aria-label={`Desplazar ${title} a la derecha`} onClick={()=>scroll(1)}><ChevronRight size={19}/></button>
   </div>
  </div>
  <div className="movie-rail" ref={rail}>{movies.map(movie=><div className="rail-item" key={movie.id}><MovieCard movie={movie}/></div>)}</div>
 </section>;
}
