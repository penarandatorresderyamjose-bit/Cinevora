import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import {AppProvider} from './context/AppContext';
import {Layout} from './components/Layout';
import {Home} from './pages/Home';
import {Explore} from './pages/Explore';
import {Categories,Category} from './pages/Categories';
import {MoviePage} from './pages/Movie';
import {Archive,ArchiveDetail} from './pages/Archive';
import {Saved} from './pages/Saved';
import {EmptyState} from './components/States';
export default function App(){return <BrowserRouter><AppProvider><Layout><Routes>
 <Route path="/" element={<Home/>}/><Route path="/explorar" element={<Explore/>}/>
 <Route path="/categorias" element={<Categories/>}/><Route path="/genero/:slug" element={<Category/>}/>
 <Route path="/pelicula/:id" element={<MoviePage/>}/><Route path="/descargas" element={<Archive/>}/>
 <Route path="/archivo/:identifier" element={<ArchiveDetail/>}/>
 <Route path="/favoritos" element={<Saved mode="favorites"/>}/><Route path="/historial" element={<Saved mode="history"/>}/>
 <Route path="*" element={<div className="container-page content-page"><EmptyState title="La página no existe" text="Quizás el enlace haya cambiado."/><div className="load-more-wrap"><Link className="btn btn-primary" to="/">Volver al inicio</Link></div></div>}/>
 </Routes></Layout></AppProvider></BrowserRouter>}
