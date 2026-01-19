import AdminConsole from './pages/AdminConsole';
import ClientDetail from './pages/ClientDetail';
import ClientForm from './pages/ClientForm';
import ClientInspectionView from './pages/ClientInspectionView';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import CompanyOnboarding from './pages/CompanyOnboarding';
import Contractors from './pages/Contractors';
import Dashboard from './pages/Dashboard';
import HelpTutorials from './pages/HelpTutorials';
import Home from './pages/Home';
import InspectionDetail from './pages/InspectionDetail';
import InspectionFlow from './pages/InspectionFlow';
import Inspections from './pages/Inspections';
import Marketing from './pages/Marketing';
import Pricing from './pages/Pricing';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import RouteOptimizer from './pages/RouteOptimizer';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import StripeSetup from './pages/StripeSetup';
import TestGoogleMapsAPI from './pages/TestGoogleMapsAPI';
import ClientLogin from './pages/ClientLogin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminConsole": AdminConsole,
    "ClientDetail": ClientDetail,
    "ClientForm": ClientForm,
    "ClientInspectionView": ClientInspectionView,
    "ClientPortal": ClientPortal,
    "Clients": Clients,
    "CompanyOnboarding": CompanyOnboarding,
    "Contractors": Contractors,
    "Dashboard": Dashboard,
    "HelpTutorials": HelpTutorials,
    "Home": Home,
    "InspectionDetail": InspectionDetail,
    "InspectionFlow": InspectionFlow,
    "Inspections": Inspections,
    "Marketing": Marketing,
    "Pricing": Pricing,
    "Properties": Properties,
    "PropertyDetail": PropertyDetail,
    "PropertyForm": PropertyForm,
    "RouteOptimizer": RouteOptimizer,
    "Schedule": Schedule,
    "Settings": Settings,
    "StripeSetup": StripeSetup,
    "TestGoogleMapsAPI": TestGoogleMapsAPI,
    "ClientLogin": ClientLogin,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};