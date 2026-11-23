import { ApiError, cached, getJson, moviePage, pageParam, textParam, yearParam } from './utils.js';
import { categories } from './categories.js';
const BASE = 'https://api.themoviedb.org/3/';
const sortChoices = new Set(['popularity.desc','primary_release_date.desc','vote_average.desc']);
export function tmdbConfigured() { return Boolean(process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY); }
async function tmdb(path: string, params: Record<string, string | number | undefined> = {}, ttl = 4 * 60_000): Promise<any> {
  if (!tmdbConfigured()) throw new ApiError(503, 'TMDB_NOT_CONFIGURED', 'Falta configurar el token de TMDB en el servidor. Consulta el archivo README.md.');
  const url = new URL(path.replace(/^\//, ''), BASE);
  url.searchParams.set('language','es-ES');
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token && process.env.TMDB_API_KEY) url.searchParams.set('api_key', process.env.TMDB_API_KEY);
  const headers: Record<string,string> = token ? { Authorization: `Bearer ${token}` } : {};
  return cached(`tmdb:${url.toString()}`, ttl, () => getJson(url, headers));
}
export async function homeFeed(feed: string, page = 1) {
  const today = new Date().toISOString().slice(0,10);
  const feeds: Record<string, [string, Record<string, string | number>]> = {
    trending: ['trending/movie/week',{}],
    popular: ['movie/popular',{region:'CO'}],
    top: ['movie/top_rated',{region:'CO'}],
    now: ['movie/now_playing',{region:'CO'}],
    upcoming: ['movie/upcoming',{region:'CO'}],
    recent: ['discover/movie',{'primary_release_date.lte':today,'primary_release_date.gte':`${new Date().getFullYear()-1}-01-01`,'vote_count.gte':10, sort_by:'primary_release_date.desc'}],
  };
  if (!feeds[feed]) throw new ApiError(400, 'INVALID_FEED', 'Sección no disponible.');
  const [path, params] = feeds[feed];
  return moviePage(await tmdb(path, {...params, page}, 6 * 60_000));
}
export async function homeData() {
  const keys = ['trending','popular','now','top','upcoming','recent'];
  const settled = await Promise.allSettled(keys.map(feed => homeFeed(feed,1)));
  const feeds: Record<string, ReturnType<typeof moviePage>> = {};
  settled.forEach((item,i) => { if (item.status === 'fulfilled') feeds[keys[i]] = item.value; });
  if (Object.keys(feeds).length === 0) throw (settled[0] as PromiseRejectedResult).reason;
  return { feeds };
}
async function keywordId(name: string): Promise<number | undefined> {
  const result = await tmdb('search/keyword',{query:name,page:1},24 * 60 * 60_000);
  const results = Array.isArray(result.results) ? result.results : [];
  const match = results.find((i: any) => String(i.name).toLowerCase() === name.toLowerCase()) || results[0];
  return match?.id;
}
export async function byCategory(slug: string, page = 1, sort = 'popularity.desc') {
  const category = categories.find(c => c.slug === slug);
  if (!category) throw new ApiError(404, 'INVALID_CATEGORY', 'No existe esta categoría.');
  const params: Record<string, string | number> = {page, sort_by:sortChoices.has(sort) ? sort : 'popularity.desc', include_adult:'false', 'vote_count.gte': sort === 'vote_average.desc' ? 100 : 0};
  if (category.genre) params.with_genres = category.genre;
  if (category.language) params.with_original_language = category.language;
  if (category.endDate) params['primary_release_date.lte'] = category.endDate;
  if (category.keyword) {
    const id = await keywordId(category.keyword);
    if (!id) return {page, total_pages:1,total_results:0,results:[]};
    params.with_keywords = id;
  }
  return moviePage(await tmdb('discover/movie',params));
}
export async function genreOptions() {
  return (await tmdb('genre/movie/list',{}, 24*60*60_000)).genres || [];
}
async function findPerson(text: string, department: 'Acting'|'Directing'): Promise<number | undefined> {
  const d = await tmdb('search/person',{query:text,include_adult:'false'});
  const persons = Array.isArray(d.results) ? d.results : [];
  const exact = persons.filter((p:any) => String(p.name).toLocaleLowerCase() === text.toLocaleLowerCase());
  const choice = exact.find((p:any) => p.known_for_department === department) || exact[0] || persons.find((p:any) => p.known_for_department === department) || persons[0];
  return choice?.id;
}
export type SearchOptions = { q?: string; actor?: string; director?: string; genre?: string; year?: string; country?: string; language?: string; sort?: string; page?: number };
export async function searchMovies(o: SearchOptions) {
  const title = textParam(o.q,90);
  const actor = textParam(o.actor,70);
  const director = textParam(o.director,70);
  const country = textParam(o.country,2).toUpperCase();
  const language = textParam(o.language,2).toLowerCase();
  const genre = /^\d{1,6}$/.test(o.genre || '') ? o.genre : '';
  const year = yearParam(o.year);
  const page = pageParam(o.page);
  const sort = sortChoices.has(o.sort || '') ? o.sort! : 'popularity.desc';
  const [actorId,directorId] = await Promise.all([actor ? findPerson(actor,'Acting') : undefined,director ? findPerson(director,'Directing') : undefined]);
  if ((actor && !actorId) || (director && !directorId)) return {page,total_pages:1,total_results:0,results:[]};
  if (!title) {
    const params: Record<string, string|number> = {page,sort_by:sort,include_adult:'false'};
    if (genre) params.with_genres = genre;
    if (year) params.primary_release_year = year;
    if (country && /^[A-Z]{2}$/.test(country)) params.with_origin_country=country;
    if (language && /^[a-z]{2}$/.test(language)) params.with_original_language=language;
    if (actorId) params.with_cast=actorId;
    if (directorId) params.with_crew=directorId;
    if (sort === 'vote_average.desc') params['vote_count.gte'] = 100;
    return moviePage(await tmdb('discover/movie',params));
  }
  const data = moviePage(await tmdb('search/movie',{query:title,page,include_adult:'false', ...(year ? {year} : {})}));
  let results: any[] = data.results;
  if (genre) results = results.filter(m => m.genre_ids?.includes(Number(genre)));
  if (language) results = results.filter(m => m.original_language === language);
  if (year) results = results.filter(m => (m.release_date || '').startsWith(year));
  if (actorId || directorId || country) {
    const checked = await Promise.all(results.map(async (movie: any) => {
      try {
        const [credits,details] = await Promise.all([
          (actorId || directorId) ? tmdb(`movie/${movie.id}/credits`,{},15*60_000) : undefined,
          country ? tmdb(`movie/${movie.id}`) : undefined,
        ]);
        if (actorId && !credits?.cast?.some((p:any)=>p.id===actorId)) return null;
        if (directorId && !credits?.crew?.some((p:any)=>p.id===directorId && p.job==='Director')) return null;
        if (country && !details?.production_countries?.some((p:any)=>p.iso_3166_1===country)) return null;
        return movie;
      } catch { return null; }
    }));
    results = checked.filter(Boolean);
  }
  if (sort === 'vote_average.desc') results.sort((a,b)=> b.vote_average-a.vote_average);
  if (sort === 'primary_release_date.desc') results.sort((a,b)=>String(b.release_date).localeCompare(String(a.release_date)));
  if (sort === 'popularity.desc') results.sort((a,b)=>b.popularity-a.popularity);
  return {...data,results, filtered_on_page:true};
}
export async function movieDetails(id: number) {
  const [movie,credits,recommendations,videoData] = await Promise.all([
    tmdb(`movie/${id}`),
    tmdb(`movie/${id}/credits`,{},20*60_000),
    tmdb(`movie/${id}/recommendations`,{page:1}),
    tmdb(`movie/${id}/videos`,{language:'en-US'}),
  ]);
  const director = (credits.crew || []).filter((p:any) => p.job === 'Director').map((p:any)=> ({id:p.id,name:p.name}));
  const cast = (credits.cast || []).slice(0,14).map((p:any)=>({id:p.id,name:p.name,character:p.character,profile_path:p.profile_path}));
  const trailers = (videoData.results || []).filter((v:any) => v.site === 'YouTube' && v.type === 'Trailer' && /^[\w-]{8,20}$/.test(v.key));
  return {...movie,directors:director,cast,trailers,recommendations:moviePage(recommendations).results};
}
export async function suggestMovies(query: string) {
  if (query.trim().length < 2) return [];
  const page = moviePage(await tmdb('search/movie',{query:query.slice(0,80),page:1,include_adult:'false'}));
  return page.results.slice(0,6).map((m:any)=>({id:m.id,title:m.title,poster_path:m.poster_path,release_date:m.release_date}));
}

export async function basedOnFavorites(ids: number[]) {
  const valid = [...new Set(ids)].filter(id=>Number.isSafeInteger(id)&&id>0).slice(0,3);
  if (!valid.length) return homeFeed('top',1);
  const responses = await Promise.allSettled(valid.map(id=>tmdb(`movie/${id}/recommendations`,{page:1})));
  const seen = new Set(valid);
  const results: any[] = [];
  for (const result of responses) {
    if (result.status === 'fulfilled') for (const movie of moviePage(result.value).results) {
      if (!seen.has(movie.id)) {seen.add(movie.id);results.push(movie);}
    }
  }
  results.sort((a,b)=>b.popularity-a.popularity);
  return {page:1,total_pages:1,total_results:results.length,results:results.slice(0,22)};
}
