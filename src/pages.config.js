import AdminConsole from './pages/AdminConsole';
import ClientDetail from './pages/ClientDetail';
import ClientForm from './pages/ClientForm';
import ClientInspectionView from './pages/ClientInspectionView';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import CompanyOnboarding from './pages/CompanyOnboarding';
import Contractors from './pages/Contractors';
import Dashboard from './pages/Dashboard';
import FollowUpDetail from './pages/FollowUpDetail';
import FollowUps from './pages/FollowUps';
import InspectionDetail from './pages/InspectionDetail';
import InspectionFlow from './pages/InspectionFlow';
import Inspections from './pages/Inspections';
import Marketing from './pages/Marketing';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import RouteOptimizer from './pages/RouteOptimizer';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import TestGoogleMapsAPI from './pages/TestGoogleMapsAPI';
import Pricing from './pages/Pricing';
import StripeSetup from './pages/StripeSetup';
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
    "FollowUpDetail": FollowUpDetail,
    "FollowUps": FollowUps,
    "InspectionDetail": InspectionDetail,
    "InspectionFlow": InspectionFlow,
    "Inspections": Inspections,
    "Marketing": Marketing,
    "Properties": Properties,
    "PropertyDetail": PropertyDetail,
    "PropertyForm": PropertyForm,
    "RouteOptimizer": RouteOptimizer,
    "Schedule": Schedule,
    "Settings": Settings,
    "TestGoogleMapsAPI": TestGoogleMapsAPI,
    "Pricing": Pricing,
    "StripeSetup": StripeSetup,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};