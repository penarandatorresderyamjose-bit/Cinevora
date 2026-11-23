import {useEffect,useRef,useState} from 'react';
import {Link,NavLink,useLocation,useNavigate} from 'react-router-dom';
import {Bookmark,Clock3,Compass,Download,Film,Heart,Home,Menu,Search,SlidersHorizontal,X,ArrowUp,ChevronRight} from 'lucide-react';
import {getSuggestions,img,yearOf} from '../lib/api';
import {useApp} from '../context/AppContext';
const links = [
 {to:'/',name:'Inicio',icon:Home},{to:'/explorar',name:'Explorar',icon:Compass},
 {to:'/categorias',name:'Categorías',icon:Film},{to:'/descargas',name:'Descargas legales',icon:Download},
 {to:'/favoritos',name:'Favoritos',icon:Heart},{to:'/historial',name:'Historial',icon:Clock3},
];
function QuickSearch({onNavigate}:{onNavigate?:()=>void}) {
 const navigate=useNavigate();const [q,setQ]=useState('');
 const [items,setItems]=useState<{id:number;title:string;poster_path:string|null;release_date:string}[]>([]);
 const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(q.trim().length<2){setItems([]);return;}
  const ctrl=new AbortController();const timer=window.setTimeout(()=>{
   getSuggestions(q,ctrl.signal).then(d=>setItems(d.results)).catch(()=>setItems([]));
  },320);
  return ()=>{clearTimeout(timer);ctrl.abort()};
 },[q]);
 useEffect(()=>{const handler=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('click',handler);return()=>document.removeEventListener('click',handler)},[]);
 const submit=(e:React.FormEvent)=>{e.preventDefault();if(!q.trim())return;navigate(`/explorar?q=${encodeURIComponent(q.trim())}`);setOpen(false);onNavigate?.()};
 return <div className="quick-search" ref={ref}>
  <form onSubmit={submit} className="quick-search-form"><Search size={18} className="text-muted"/>
   <input aria-label="Buscar películas" value={q} onFocus={()=>setOpen(true)} onChange={e=>{setQ(e.target.value);setOpen(true)}} placeholder="Buscar películas..." maxLength={90}/>
   {q&&<button type="button" aria-label="Borrar búsqueda" onClick={()=>{setQ('');setItems([])}}><X size={16}/></button>}
   <button type="submit" className="quick-submit" aria-label="Buscar"><ChevronRight size={18}/></button>
  </form>
  {open&&q.trim().length>=2&&<div className="suggestions">
   {items.map(item=><Link key={item.id} to={`/pelicula/${item.id}`} onClick={()=>{setOpen(false);onNavigate?.()}} className="suggestion">
     {item.poster_path?<img alt="" src={img(item.poster_path,'w342')}/>:<div className="suggestion-placeholder"><Film size={16}/></div>}
     <span className="min-w-0"><strong className="block truncate">{item.title}</strong><small>{yearOf(item.release_date)}</small></span><ChevronRight size={15}/>
    </Link>)}
   <button className="suggestion suggestion-all" onClick={submit as unknown as React.MouseEventHandler<HTMLButtonElement>}><SlidersHorizontal size={17}/> Ver todos los resultados <ChevronRight size={15}/></button>
  </div>}
 </div>;
}
export function Layout({children}:{children:React.ReactNode}) {
 const [menu,setMenu]=useState(false);const [showTop,setShowTop]=useState(false);const location=useLocation();const {favorites,toasts,removeToast}=useApp();
 useEffect(()=>{setMenu(false);window.scrollTo({top:0,behavior:'instant'});},[location.pathname]);
 useEffect(()=>{const scroll=()=>setShowTop(window.scrollY>680);window.addEventListener('scroll',scroll,{passive:true});return()=>window.removeEventListener('scroll',scroll)},[]);
 useEffect(()=>{document.body.style.overflow=menu?'hidden':'';return()=>{document.body.style.overflow=''}},[menu]);
 return <div className="site-shell">
  <header className="topbar">
   <div className="topbar-inner">
    <Link to="/" className="brand" aria-label="Cinevora, inicio"><span className="brand-icon"><Film size={22}/></span>CINE<span>VORA</span><small>✦</small></Link>
    <nav className="desktop-nav" aria-label="Navegación principal">{links.slice(0,4).map(l=><NavLink key={l.to} to={l.to} end={l.to==='/'} className={({isActive})=>`nav-link ${isActive?'selected':''}`}>{l.name}</NavLink>)}</nav>
    <div className="top-actions"><div className="desktop-search"><QuickSearch/></div>
     <Link className="icon-action favorites-header" aria-label="Mis favoritos" title="Mis favoritos" to="/favoritos"><Bookmark size={20}/>{favorites.length>0&&<span className="fav-count">{favorites.length>9?'9+':favorites.length}</span>}</Link>
     <button className="icon-action mobile-menu-btn" onClick={()=>setMenu(v=>!v)} aria-label="Abrir menú" aria-expanded={menu}>{menu?<X size={23}/>:<Menu size={23}/>}</button>
    </div>
   </div>
  </header>
  <div className="mobile-search-bar"><QuickSearch onNavigate={()=>setMenu(false)}/></div>
  {menu&&<><div className="drawer-backdrop" onClick={()=>setMenu(false)}/><aside className="mobile-drawer" aria-label="Menú móvil">
     <p className="drawer-label">EXPLORAR CINEVORA</p>
     {links.map(l=><NavLink key={l.to} end={l.to==='/'} to={l.to} onClick={()=>setMenu(false)} className={({isActive})=>`drawer-link ${isActive?'selected':''}`}><l.icon size={19}/>{l.name}<ChevronRight size={15} className="ml-auto"/></NavLink>)}
     <div className="drawer-note">Descubre cine y consulta descargas autorizadas.</div>
   </aside></>}
  <main id="main">{children}</main>
  <footer className="footer"><div className="container-page footer-inner">
   <div><Link to="/" className="brand footer-brand"><span className="brand-icon"><Film size={19}/></span>CINE<span>VORA</span></Link><p>El cine tiene infinitas historias. Explóralas.</p></div>
   <div className="footer-links"><Link to="/categorias">Géneros</Link><Link to="/descargas">Descargas legales</Link><Link to="/favoritos">Mis favoritos</Link></div>
   <p className="tmdb-credit">Información e imágenes de <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB. Archivos de video: <a href="https://archive.org/" target="_blank" rel="noopener noreferrer">Internet Archive</a>. Las licencias las declaran quienes suben los archivos.</p>
  </div></footer>
  {showTop&&<button className="back-top" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Volver arriba"><ArrowUp size={20}/></button>}
  <div className="toast-stack" aria-live="polite">{toasts.map(t=><div key={t.id} className={`toast ${t.kind}`} role="status"><span>{t.message}</span><button aria-label="Cerrar aviso" onClick={()=>removeToast(t.id)}><X size={16}/></button></div>)}</div>
 </div>;
}
