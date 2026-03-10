/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import VisitFlow from './pages/VisitFlow';
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
    "VisitFlow": VisitFlow,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};