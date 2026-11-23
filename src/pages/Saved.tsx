import {Clock3,Heart,Trash2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {MovieCard} from '../components/MovieCard';
import {EmptyState} from '../components/States';
import {useApp} from '../context/AppContext';
export function Saved({mode}:{mode:'favorites'|'history'}){
 const {favorites,history,clearHistory}=useApp();const fav=mode==='favorites';const movies=fav?favorites:history;
 return <div className="container-page content-page"><div className="page-heading"><p className="eyebrow">TU ESPACIO PERSONAL</p><h1>{fav?'Mis favoritas':'Mi historial'}<span className="pink-dot">.</span></h1><p>{fav?'Las películas que guardas para volver a descubrirlas.':'Las películas cuyas fichas has consultado recientemente.'}</p></div>
 <div className="results-heading"><h2>{movies.length} {movies.length===1?'película':'películas'}</h2>{!fav&&movies.length>0&&<button onClick={()=>{if(window.confirm('¿Borrar todo el historial de películas consultadas?'))clearHistory()}} className="clear-filter"><Trash2 size={16}/> Borrar historial</button>}</div>
 {movies.length>0?<div className="poster-grid">{movies.map(m=><MovieCard movie={m} key={m.id}/>)}</div>:<EmptyState title={fav?'Todavía no tienes favoritos':'Tu historial está vacío'} text={fav?'Guarda películas con el icono de corazón para encontrarlas aquí.':'Cuando abras la ficha de una película, aparecerá en esta sección.'}/>}
 <div className="load-more-wrap"><Link to="/explorar" className="btn btn-secondary">{fav?<Heart size={17}/>:<Clock3 size={17}/>} Explorar más películas</Link></div>
 </div>
}
