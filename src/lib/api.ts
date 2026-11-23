import type {ArchiveMovie,ArchivePage,Movie,MovieDetails,MoviePage} from '../types';
export class ClientError extends Error {constructor(public code:string,message:string){super(message);}}
export async function getApi<T>(route:string, signal?:AbortSignal):Promise<T> {
  let response:Response;
  try {response = await fetch(`/api${route}`,{signal,headers:{Accept:'application/json'}})}
  catch(error) {if (signal?.aborted) throw error; throw new ClientError('NETWORK','No se pudo conectar con el servidor. Comprueba tu conexión.');}
  let data:any;
  try {data = await response.json()} catch {throw new ClientError('INVALID_RESPONSE','El servidor devolvió una respuesta inesperada.');}
  if (!response.ok) throw new ClientError(data.code || 'API_ERROR',data.message || 'No fue posible cargar la información.');
  return data as T;
}
export function paramsOf(filters:Record<string,string|number|undefined>) {
  const p = new URLSearchParams();
  for (const [key,value] of Object.entries(filters)) if(value !== undefined && String(value).trim() !== '')p.set(key,String(value));
  return p.toString();
}
export const img = (path:string|null|undefined, width:'w342'|'w500'|'w780'|'w1280' = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${width}${path}` : '';
export const yearOf = (date?:string) => date?.slice(0,4) || 'Sin fecha';
export const stars = (score:number) => Number.isFinite(score) && score > 0 ? score.toFixed(1) : 'S/C';
export function getMovie(id:string|number,signal?:AbortSignal) {return getApi<MovieDetails>(`/movie/${id}`,signal);}
export function getFeed(feed:string,page=1,signal?:AbortSignal){return getApi<MoviePage>(`/feed/${encodeURIComponent(feed)}?page=${page}`,signal);}
export function getSearch(filters:Record<string,string|number|undefined>,signal?:AbortSignal){return getApi<MoviePage>(`/search?${paramsOf(filters)}`,signal);}
export function getArchive(query:string,page:number,language='all',signal?:AbortSignal){return getApi<ArchivePage>(`/archive?${paramsOf({q:query,page,lang:language})}`,signal);}
export function getArchiveItem(identifier:string,signal?:AbortSignal){return getApi<ArchiveMovie>(`/archive/${encodeURIComponent(identifier)}`,signal);}
export function getArchiveVariant(identifier:string,index:number,signal?:AbortSignal){return getApi<{id:number;verified:boolean;downloadUrl:string|null}>(`/archive/${encodeURIComponent(identifier)}/variant/${index}`,signal);}
export function getSuggestions(query:string,signal?:AbortSignal){return getApi<{results:Pick<Movie,'id'|'title'|'poster_path'|'release_date'>[]}>(`/suggest?q=${encodeURIComponent(query)}`,signal);}
