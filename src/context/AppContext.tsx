import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import type {Movie} from '../types';
import {compactMovie,readStorage,writeStorage,type SavedMovie} from '../lib/storage';
type Toast = {id:number;message:string;kind:'success'|'info'|'error'};
type ContextValue = {
  favorites:SavedMovie[]; history:SavedMovie[];isFavorite:(id:number)=>boolean;
  toggleFavorite:(movie:Movie)=>void;recordVisit:(movie:Movie)=>void;clearHistory:()=>void;
  notify:(message:string,kind?:Toast['kind'])=>void;toasts:Toast[];removeToast:(id:number)=>void;
};
const AppContext = createContext<ContextValue|null>(null);
export function AppProvider({children}:{children:ReactNode}) {
 const [favorites,setFavorites] = useState<SavedMovie[]>(()=>readStorage('cinevora-favorites'));
 const [history,setHistory] = useState<SavedMovie[]>(()=>readStorage('cinevora-history'));
 const [toasts,setToasts] = useState<Toast[]>([]);
 useEffect(()=>writeStorage('cinevora-favorites',favorites),[favorites]);
 useEffect(()=>writeStorage('cinevora-history',history),[history]);
 const removeToast=useCallback((id:number)=>setToasts(t=>t.filter(x=>x.id!==id)),[]);
 const notify=useCallback((message:string,kind:Toast['kind']='info')=>{
   const id = Date.now()+Math.random();setToasts(t=>[...t.slice(-3),{id,message,kind}]);
   window.setTimeout(()=>removeToast(id),3600);
 },[removeToast]);
 const isFavorite=useCallback((id:number)=>favorites.some(m=>m.id===id),[favorites]);
 const toggleFavorite=useCallback((movie:Movie)=>{
   if(favorites.some(f=>f.id===movie.id)){
    setFavorites(f=>f.filter(m=>m.id!==movie.id));notify('Se quitó de favoritos');
   } else {setFavorites(f=>[compactMovie(movie),...f.filter(m=>m.id!==movie.id)]);notify('Guardada en favoritos','success');}
 },[favorites,notify]);
 const recordVisit=useCallback((movie:Movie)=>{
   setHistory(h=>[compactMovie(movie),...h.filter(m=>m.id!==movie.id)].slice(0,60));
 },[]);
 const clearHistory=useCallback(()=>{setHistory([]);notify('Historial borrado','success')},[notify]);
 const value = useMemo(()=>({favorites,history,isFavorite,toggleFavorite,recordVisit,clearHistory,notify,toasts,removeToast}),
 [favorites,history,isFavorite,toggleFavorite,recordVisit,clearHistory,notify,toasts,removeToast]);
 return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(){const context = useContext(AppContext);if(!context)throw new Error('AppProvider ausente');return context;}
