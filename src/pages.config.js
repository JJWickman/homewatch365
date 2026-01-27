import Billing from './pages/Billing';
import BillingTest from './pages/BillingTest';
import ClientDetail from './pages/ClientDetail';
import ClientForm from './pages/ClientForm';
import ClientInspectionView from './pages/ClientInspectionView';
import ClientLogin from './pages/ClientLogin';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import CompanyOnboarding from './pages/CompanyOnboarding';
import Contractors from './pages/Contractors';
import Dashboard from './pages/Dashboard';
import DispatcherDashboard from './pages/DispatcherDashboard';
import ForgotPassword from './pages/ForgotPassword';
import HelpTutorials from './pages/HelpTutorials';
import Home from './pages/Home';
import ImportData from './pages/ImportData';
import InspectionDetail from './pages/InspectionDetail';
import InspectionFlow from './pages/InspectionFlow';
import Inspections from './pages/Inspections';
import InvitationAccept from './pages/InvitationAccept';
import InvoicePayment from './pages/InvoicePayment';
import Marketing from './pages/Marketing';
import OnboardingTest from './pages/OnboardingTest';
import Pricing from './pages/Pricing';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import RouteOptimizer from './pages/RouteOptimizer';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import StripeSetup from './pages/StripeSetup';
import SuperAdminConsole from './pages/SuperAdminConsole';
import TestGoogleMapsAPI from './pages/TestGoogleMapsAPI';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Billing": Billing,
    "BillingTest": BillingTest,
    "ClientDetail": ClientDetail,
    "ClientForm": ClientForm,
    "ClientInspectionView": ClientInspectionView,
    "ClientLogin": ClientLogin,
    "ClientPortal": ClientPortal,
    "Clients": Clients,
    "CompanyOnboarding": CompanyOnboarding,
    "Contractors": Contractors,
    "Dashboard": Dashboard,
    "DispatcherDashboard": DispatcherDashboard,
    "ForgotPassword": ForgotPassword,
    "HelpTutorials": HelpTutorials,
    "Home": Home,
    "ImportData": ImportData,
    "InspectionDetail": InspectionDetail,
    "InspectionFlow": InspectionFlow,
    "Inspections": Inspections,
    "InvitationAccept": InvitationAccept,
    "InvoicePayment": InvoicePayment,
    "Marketing": Marketing,
    "OnboardingTest": OnboardingTest,
    "Pricing": Pricing,
    "Properties": Properties,
    "PropertyDetail": PropertyDetail,
    "PropertyForm": PropertyForm,
    "RouteOptimizer": RouteOptimizer,
    "Schedule": Schedule,
    "Settings": Settings,
    "StripeSetup": StripeSetup,
    "SuperAdminConsole": SuperAdminConsole,
    "TestGoogleMapsAPI": TestGoogleMapsAPI,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};