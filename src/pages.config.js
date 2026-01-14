import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetail from './pages/ClientDetail';
import Properties from './pages/Properties';
import PropertyForm from './pages/PropertyForm';
import PropertyDetail from './pages/PropertyDetail';
import Inspections from './pages/Inspections';
import InspectionDetail from './pages/InspectionDetail';
import InspectionFlow from './pages/InspectionFlow';
import Schedule from './pages/Schedule';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import CompanyOnboarding from './pages/CompanyOnboarding';
import ClientPortal from './pages/ClientPortal';
import ClientInspectionView from './pages/ClientInspectionView';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "ClientForm": ClientForm,
    "ClientDetail": ClientDetail,
    "Properties": Properties,
    "PropertyForm": PropertyForm,
    "PropertyDetail": PropertyDetail,
    "Inspections": Inspections,
    "InspectionDetail": InspectionDetail,
    "InspectionFlow": InspectionFlow,
    "Schedule": Schedule,
    "Tasks": Tasks,
    "Settings": Settings,
    "CompanyOnboarding": CompanyOnboarding,
    "ClientPortal": ClientPortal,
    "ClientInspectionView": ClientInspectionView,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};