import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);

    // Helper functions
    const addTitle = (text) => {
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(text, margin, yPosition);
      yPosition += 12;
    };

    const addHeading = (text) => {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 58, 95);
      doc.text(text, margin, yPosition);
      yPosition += 8;
    };

    const addSubheading = (text) => {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(text, margin, yPosition);
      yPosition += 6;
    };

    const addText = (text, indent = 0) => {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      const wrapped = doc.splitTextToSize(text, maxWidth - indent);
      doc.text(wrapped, margin + indent, yPosition);
      yPosition += wrapped.length * 5 + 1;
    };

    const addStep = (stepNum, title, details) => {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 58, 95);
      doc.text(`${stepNum}. ${title}`, margin, yPosition);
      yPosition += 6;
      addText(details, 5);
      yPosition += 2;
    };

    const checkPageBreak = (neededSpace = 30) => {
      if (yPosition + neededSpace > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Title Page
    addTitle('Testing Instructions for Estate Watch 365');
    yPosition += 5;
    addText('Step-by-step guide to create your account and explore the home watch management platform');
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 40;

    // Introduction
    addHeading('Overview');
    addText('This guide walks you through creating your account and exploring the key features of Estate Watch 365. You will:');
    addText('- Set up your company account and profile', 5);
    addText('- Create sample clients and properties', 5);
    addText('- Configure products and pricing', 5);
    addText('- Explore checklists and assign them to properties', 5);
    yPosition += 10;

    // Section 1: Account Creation
    checkPageBreak(80);
    addHeading('Step 1: Create Your Account');
    addStep('1a', 'Sign Up', 'Go to the login page and click Sign Up. Enter your email address, create a password, and verify your email.');
    addStep('1b', 'Complete Your Profile', 'Enter your first name, last name, and phone number. This creates your user account in the system.');
    yPosition += 5;

    // Section 2: Company Setup
    checkPageBreak(80);
    addHeading('Step 2: Create Your Company');
    addStep('2a', 'Access Company Setup', 'After signing up, you will be taken to the Company Onboarding screen. This is where you create your first company/tenant.');
    addStep('2b', 'Enter Company Details', 'Fill in your company name (e.g., My Home Watch Company), slug (URL-friendly name), address, city, state, and contact information.');
    addStep('2c', 'Complete Onboarding', 'Click Create Company to finish setup. You now have your own isolated tenant workspace.');
    yPosition += 5;

    // Section 3: Create Clients
    checkPageBreak(80);
    addHeading('Step 3: Create Sample Clients');
    addStep('3a', 'Navigate to Clients', 'From the main dashboard, click Clients in the sidebar.');
    addStep('3b', 'Add New Client', 'Click the Add Client button in the top right. Fill in required fields: First Name, Last Name, Email, and Address.');
    addStep('3c', 'Configure Portal Access', 'Enable Portal Access for the client so they can log in to view their properties and reports.');
    addStep('3d', 'Save Client', 'Click Create Client. You should now see this client in your list.');
    yPosition += 5;

    // Section 4: Create Properties
    checkPageBreak(80);
    addHeading('Step 4: Create Sample Properties');
    addStep('4a', 'Navigate to Properties', 'Click Properties in the sidebar.');
    addStep('4b', 'Add New Property', 'Click Add Property button. Select a client you created, then enter property details.');
    addStep('4c', 'Fill Key Information', 'Enter: Address, City, State, ZIP, Property Type (Single Family/Condo/Commercial), and Status (Occupied/Vacant/Seasonal).');
    addStep('4d', 'Add Access Information', 'Fill in alarm codes, gate codes, WiFi details, and any special access instructions needed for visits.');
    addStep('4e', 'Save Property', 'Click Create to add the property to the system.');
    yPosition += 5;

    // Section 5: Explore Products
    checkPageBreak(80);
    addHeading('Step 5: Review Products & Services');
    addStep('5a', 'Navigate to Settings', 'Click Settings in the sidebar.');
    addStep('5b', 'View Products', 'Go to the Products tab. This shows the default services (Standard Home Watch Visit) and any add-ons configured for your company.');
    addStep('5c', 'Understand Pricing', 'Each product shows: Base Price (per visit), Visit Type, and Add-on Charges (e.g., extra bedrooms).');
    addStep('5d', 'Create Custom Product', 'Optional: Click Add Product to create additional services your company offers.');
    yPosition += 5;

    // Section 6: Explore Checklists
    checkPageBreak(80);
    addHeading('Step 6: Review Checklists');
    addStep('6a', 'Navigate to Settings - Templates', 'Click Settings, then select Checklist Templates tab.');
    addStep('6b', 'View Available Templates', 'See the default checklists (Single Family, Condo/Villa, High-Rise, Commercial). Each has sections and items.');
    addStep('6c', 'Understand Checklist Structure', 'Templates define what inspectors check during visits: exterior, interior, utilities, appliances, etc.');
    yPosition += 5;

    // Section 7: Configure Client Pricing
    checkPageBreak(80);
    addHeading('Step 7: Create Pricing for a Client Property');
    addStep('7a', 'Open Property Detail', 'Click Properties, find your property, and click to open it.');
    addStep('7b', 'Go to Pricing Tab', 'In the property detail page, click the Pricing tab.');
    addStep('7c', 'Set Service Subscription', 'Select a primary service (e.g., Standard Home Watch Visit) and set the monthly rate for this property.');
    addStep('7d', 'Add Supplementary Services', 'Optional: Add extra services (add-ons) that apply to this property (e.g., Extra Bedroom Charge).');
    addStep('7e', 'Save Pricing', 'Click Save to confirm. This pricing will be used for future invoices.');
    yPosition += 5;

    // Section 8: Assign Checklist
    checkPageBreak(80);
    addHeading('Step 8: Assign Checklist to Property');
    addStep('8a', 'Open Property Detail', 'Click Properties, select your property.');
    addStep('8b', 'Go to Checklist Tab', 'In the property detail, click the Checklist tab.');
    addStep('8c', 'Select a Template', 'Click Select Checklist Template and choose a template (e.g., Single Family Home).');
    addStep('8d', 'Customize if Needed', 'Optional: Customize sections/items for this specific property by removing irrelevant items.');
    addStep('8e', 'Save Assignment', 'Click Save Checklist. Now when field staff visit, they will use this checklist.');
    yPosition += 5;

    // Final Section: Next Steps
    checkPageBreak(60);
    addHeading('Next Steps: Ready for Testing');
    addText('Congratulations! You have successfully:');
    addText('- Created your company account and workspace', 5);
    addText('- Added sample clients and properties', 5);
    addText('- Reviewed products and checklists', 5);
    addText('- Configured pricing and checklists for a property', 5);
    yPosition += 10;

    addText('Your isolated workspace is now ready for comprehensive testing. Each of the 3 test accounts has completely separate data.');
    yPosition += 10;

    addHeading('Security & Data Isolation');
    addText('Each test user account has a separate Company (tenant) workspace. Your clients, properties, visits, and pricing are completely isolated from other test users. This ensures multi-tenant data security.');
    yPosition += 10;

    addHeading('Need Help?');
    addText('If you encounter any issues during setup, please document the problem and let the development team know. This feedback helps us improve the system.');

    // Generate and return PDF
    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=Estate-Watch-365-Testing-Instructions.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});