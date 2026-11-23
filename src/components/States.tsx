import {AlertTriangle,Clapperboard,RefreshCw} from 'lucide-react';
export function Loading({label='Cargando películas...',cards=false}:{label?:string;cards?:boolean}) {
 if(cards) return <div className="poster-grid">{Array.from({length:10},(_,i)=><div className="poster-skeleton" key={i}><div className="skeleton-image skeleton"/><div className="skeleton-line skeleton"/><div className="skeleton-line short skeleton"/></div>)}</div>;
 return <div className="state-block" role="status"><div className="spinner"/>{label}</div>;
}
export function ErrorState({message,onRetry}:{message:string;onRetry?:()=>void}) {
 return <div className="state-block" role="alert"><AlertTriangle size={30} className="text-accent"/><p>{message}</p>{onRetry&&<button className="btn btn-secondary" onClick={onRetry}><RefreshCw size={16}/> Volver a intentar</button>}</div>;
}
export function EmptyState({title='No encontramos películas',text='Prueba con otra búsqueda o categoría.'}:{title?:string;text?:string}) {
 return <div className="state-block"><Clapperboard size={36} className="text-accent"/><h3 className="text-lg font-bold">{title}</h3><p>{text}</p></div>;
}
