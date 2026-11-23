export type SavedMovie = {id:number;title:string;poster_path:string|null;backdrop_path:string|null;vote_average:number;release_date:string;overview:string};
export function compactMovie(movie:SavedMovie):SavedMovie {
  return {id:movie.id,title:movie.title,poster_path:movie.poster_path,backdrop_path:movie.backdrop_path,
    vote_average:movie.vote_average,release_date:movie.release_date,overview:movie.overview};
}
export function readStorage(key:string):SavedMovie[] {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]');return Array.isArray(value) ? value.filter(m=>m && Number.isInteger(m.id)).slice(0,100) : [];} catch {return []}
}
export function writeStorage(key:string,movies:SavedMovie[]) {
  try {localStorage.setItem(key,JSON.stringify(movies.slice(0,100)))}catch {/* modo privado: almacenamiento no disponible */}
}
