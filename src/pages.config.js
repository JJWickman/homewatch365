import ClientDetail from './pages/ClientDetail';
import ClientForm from './pages/ClientForm';
import ClientInspectionView from './pages/ClientInspectionView';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import CompanyOnboarding from './pages/CompanyOnboarding';
import Dashboard from './pages/Dashboard';
import InspectionDetail from './pages/InspectionDetail';
import InspectionFlow from './pages/InspectionFlow';
import Inspections from './pages/Inspections';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ClientDetail": ClientDetail,
    "ClientForm": ClientForm,
    "ClientInspectionView": ClientInspectionView,
    "ClientPortal": ClientPortal,
    "Clients": Clients,
    "CompanyOnboarding": CompanyOnboarding,
    "Dashboard": Dashboard,
    "InspectionDetail": InspectionDetail,
    "InspectionFlow": InspectionFlow,
    "Inspections": Inspections,
    "Properties": Properties,
    "PropertyDetail": PropertyDetail,
    "PropertyForm": PropertyForm,
    "Schedule": Schedule,
    "Settings": Settings,
    "Tasks": Tasks,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};