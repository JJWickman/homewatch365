import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetail from './pages/ClientDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "ClientForm": ClientForm,
    "ClientDetail": ClientDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};