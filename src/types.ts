export interface Movie {
  id:number; title:string; original_title?:string; overview:string; release_date:string;
  poster_path:string|null; backdrop_path:string|null; vote_average:number;vote_count?:number;
  genre_ids?:number[]; genres?:{id:number;name:string}[];popularity?:number;
  original_language?:string; runtime?:number; tagline?:string; status?:string;
  spoken_languages?:{english_name:string;name:string;iso_639_1:string}[];
  production_countries?:{iso_3166_1:string;name:string}[];
}
export interface MoviePage {page:number;total_pages:number;total_results:number;results:Movie[];filtered_on_page?:boolean}
export interface MovieDetails extends Movie {
  directors:{id:number;name:string}[];
  cast:{id:number;name:string;character:string;profile_path:string|null}[];
  trailers:{id:string;name:string;key:string;type:string}[];
  recommendations:Movie[];
}
export interface Category {slug:string;title:string;caption:string}
export interface ArchiveVariant {
 id:number;fileName:string;fileSize:number;fileFormat:string;width:number|null;height:number|null;quality:string;
 language:'es'|'en'|null;languageSource:'archivo'|'metadatos'|null;
}
export interface ArchiveMovie {
 identifier:string;title:string;description:string;creator:string;year:string;
 image:string;sourceUrl:string;license:{label:string;url:string;terms:string};
 fileName:string;fileSize:number;fileFormat:string;downloadUrl:string|null;downloadVerified:boolean;
 declaredLanguages:('es'|'en')[];variants:ArchiveVariant[];
}
export interface ArchivePage {page:number;results:ArchiveMovie[];hasMore:boolean;notice:string}
