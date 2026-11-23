import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { ApiError, numericId, pageParam, textParam } from './utils.js';
import { homeData, homeFeed, movieDetails, searchMovies, suggestMovies, byCategory, genreOptions, basedOnFavorites, tmdbConfigured } from './tmdb.js';
import { archiveDetail, archiveSearch, archiveVariant } from './archive.js';
import { categories } from './categories.js';
const app = express();
app.disable('x-powered-by');
// Render coloca Express detrás de un proxy HTTPS.
app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:false}));
app.use('/api',rateLimit({windowMs:60_000,limit:120,standardHeaders:'draft-7',legacyHeaders:false,
  message:{code:'RATE_LIMIT',message:'Demasiadas solicitudes. Inténtalo dentro de un minuto.'}}));
const asyncRoute = (fn: (req:express.Request,res:express.Response)=>Promise<unknown>) =>
  (req:express.Request,res:express.Response,next:express.NextFunction) => {Promise.resolve(fn(req,res)).catch(next);};
app.get('/api/health',(_req,res)=>res.json({status:'ok',tmdbConfigured:tmdbConfigured(),archiveEnabled:true,version:'1.1.0'}));
app.get('/api/categories',(_req,res)=>res.json({categories}));
app.get('/api/genres',asyncRoute(async(_req,res)=>res.json({genres:await genreOptions()})));
app.get('/api/home',asyncRoute(async(_req,res)=>res.json(await homeData())));
app.get('/api/feed/:feed',asyncRoute(async(req,res)=>res.json(await homeFeed(req.params.feed,pageParam(req.query.page)))));
app.get('/api/category/:slug',asyncRoute(async(req,res)=>res.json(await byCategory(req.params.slug,pageParam(req.query.page),textParam(req.query.sort,40)))));
app.get('/api/search',asyncRoute(async(req,res)=>res.json(await searchMovies({
  q:textParam(req.query.q,90),actor:textParam(req.query.actor,70),director:textParam(req.query.director,70),
  genre:textParam(req.query.genre,6),year:textParam(req.query.year,4),country:textParam(req.query.country,2),
  language:textParam(req.query.language,2),sort:textParam(req.query.sort,35),page:pageParam(req.query.page)
}))));
app.get('/api/recommendations',asyncRoute(async(req,res)=>{
  const ids=textParam(req.query.ids,80).split(',').map(Number);
  res.json(await basedOnFavorites(ids));
}));
app.get('/api/suggest',asyncRoute(async(req,res)=>res.json({results:await suggestMovies(textParam(req.query.q,80))})));
app.get('/api/movie/:id',asyncRoute(async(req,res)=>res.json(await movieDetails(numericId(req.params.id)))));
app.get('/api/archive',asyncRoute(async(req,res)=>res.json(await archiveSearch(textParam(req.query.q,75),req.query.page,req.query.lang))));
app.get('/api/archive/:identifier/variant/:index',asyncRoute(async(req,res)=>res.json(await archiveVariant(req.params.identifier,req.params.index))));
app.get('/api/archive/:identifier',asyncRoute(async(req,res)=>res.json(await archiveDetail(req.params.identifier))));
app.use('/api',(req,res)=>res.status(404).json({code:'NOT_FOUND',message:'Ruta no encontrada.'}));
// Usar el directorio de trabajo evita import.meta.url, que puede quedar
// undefined cuando Netlify empaqueta esta funcion en CommonJS.
// En produccion Netlify sirve los archivos de dist por separado.
const root = path.resolve(process.cwd(), 'dist');
app.use(express.static(root,{maxAge:'1h',index:false}));
app.get('*',(req,res,next)=>{
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(root,'index.html'),err=>{if(err)next(err);});
});
const handleError: ErrorRequestHandler = (err,req,res,_next)=>{
  const status = err instanceof ApiError ? err.status : 500;
  const code = err instanceof ApiError ? err.code : 'SERVER_ERROR';
  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(`[${new Date().toISOString()}] ${req.path}: ${code}`);
  res.status(status).json({code,message:err instanceof ApiError ? err.message:'Ocurrió un error inesperado en el servidor.'});
};
app.use(handleError);
export default app;
