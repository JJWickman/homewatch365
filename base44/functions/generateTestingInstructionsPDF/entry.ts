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
    addTitle('Testing Instructions for HomeWatch365');
    yPosition += 5;
    addText('Complete step-by-step guide to validate the core functionality of the platform');
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 40;

    // Introduction
    addHeading('Overview');
    addText('This testing guide walks you through validating the core functionality of HomeWatch365. Complete each step in order to verify the platform works as expected.');
    yPosition += 5;

    // Section 1: Account Creation
    checkPageBreak(80);
    addHeading('Step 1: Create Your Account & Subdomain');
    addStep('1a', 'Sign Up', 'Go to the login page and click Sign Up. Enter your email address, create a password, and verify your email.');
    addStep('1b', 'Create Your Subdomain', 'On the Company Onboarding screen, enter a subdomain (e.g., mycompany). This becomes your permanent access URL: mycompany.estatewatch365.com');
    addStep('1c', 'Verify Access', 'After creating your subdomain, log out and log back in using your subdomain URL. This ensures your account is linked correctly.');
    yPosition += 5;

    // Section 2: Company Setup
    checkPageBreak(80);
    addHeading('Step 2: Update Company Information');
    addStep('2a', 'Go to Settings', 'From the dashboard, click Settings in the sidebar.');
    addStep('2b', 'Update Company Details', 'In the Company tab, update: Company Name, Address, City, State, ZIP, Phone, and Email.');
    addStep('2c', 'Add Branding', 'Upload your company logo and set primary/accent colors for your branded dashboard.');
    addStep('2d', 'Save Changes', 'Click Save. Your company profile is now configured.');
    yPosition += 5;

    // Section 3: Validate Checklist Templates
    checkPageBreak(80);
    addHeading('Step 3: Validate Checklist Templates are Loaded');
    addStep('3a', 'Go to Settings', 'Click Settings, then select the Checklist Templates tab.');
    addStep('3b', 'Verify Templates', 'Confirm you see default templates: Single Family Home, Condo/Villa, High-Rise, and Commercial.');
    addStep('3c', 'Review Structure', 'Click on one template to see its sections and checklist items. Each template should have relevant categories for that property type.');
    yPosition += 5;

    // Section 4: Validate Products
    checkPageBreak(80);
    addHeading('Step 4: Validate Products are Loaded');
    addStep('4a', 'Go to Settings', 'Click Settings, then select the Products tab.');
    addStep('4b', 'Verify Default Products', 'Confirm you see the default product: Standard Home Watch Visit with base pricing.');
    addStep('4c', 'Check Add-ons', 'Verify any add-on services are listed (e.g., Extra Bedroom Charge, Pool Maintenance).');
    yPosition += 5;

    // Section 5: Create a Client
    checkPageBreak(80);
    addHeading('Step 5: Create a Client');
    addStep('5a', 'Navigate to Clients', 'Click Clients in the sidebar.');
    addStep('5b', 'Add New Client', 'Click Add Client. Enter First Name, Last Name, Email, and Address.');
    addStep('5c', 'Enable Portal Access', 'Toggle on Portal Access so the client can view their properties and reports.');
    addStep('5d', 'Save', 'Click Create Client. Verify the client appears in your list.');
    yPosition += 5;

    // Section 6: Create a Property with Aerial View
    checkPageBreak(80);
    addHeading('Step 6: Create a Property & Pull Aerial View');
    addStep('6a', 'Navigate to Properties', 'Click Properties in the sidebar.');
    addStep('6b', 'Add New Property', 'Click Add Property. Select the client you created.');
    addStep('6c', 'Enter Address Details', 'Enter Address, City, State, ZIP, Property Type (Single Family/Condo/High-Rise), and Status.');
    addStep('6d', 'Pull Aerial View', 'As you enter the address, the system will auto-populate GPS coordinates and pull down an aerial/satellite view of the property.');
    addStep('6e', 'Add Access Info', 'Enter alarm codes, gate codes, WiFi details, and any access instructions.');
    addStep('6f', 'Save Property', 'Click Create. The property is now in the system with its aerial view.');
    yPosition += 5;

    // Section 7: Set Up Pricing
    checkPageBreak(80);
    addHeading('Step 7: Create Pricing for the Property');
    addStep('7a', 'Open Property Detail', 'From Properties, click on the property you created.');
    addStep('7b', 'Go to Pricing Tab', 'Click the Pricing tab.');
    addStep('7c', 'Select Primary Service', 'Choose Standard Home Watch Visit (or your default product).');
    addStep('7d', 'Set Monthly Rate', 'Enter the monthly service rate for this property based on your pricing model.');
    addStep('7e', 'Add Add-ons (Optional)', 'Select any additional charges (extra bedrooms, pool maintenance, etc.).');
    addStep('7f', 'Save', 'Click Save. Pricing is now configured for this property.');
    yPosition += 5;

    // Section 8: Create Checklist for Property
    checkPageBreak(80);
    addHeading('Step 8: Create a Checklist for the Property');
    addStep('8a', 'Open Property Detail', 'From Properties, click on your property.');
    addStep('8b', 'Go to Checklist Tab', 'Click the Checklist tab.');
    addStep('8c', 'Select Template', 'Click Select Checklist Template. Choose the appropriate template (Single Family Home, Condo/Villa, or High-Rise).');
    addStep('8d', 'Customize (Optional)', 'You can customize sections or remove irrelevant items for this specific property.');
    addStep('8e', 'Save Checklist', 'Click Save. Field staff will now use this checklist during property visits.');
    yPosition += 5;

    // Final Section: Testing Complete
    checkPageBreak(60);
    addHeading('Testing Complete!');
    addText('You have successfully validated:');
    addText('- User account creation with subdomain setup', 5);
    addText('- Company information and branding', 5);
    addText('- Checklist templates loaded correctly', 5);
    addText('- Products/services loaded correctly', 5);
    addText('- Client creation and management', 5);
    addText('- Property creation with aerial view', 5);
    addText('- Pricing configuration', 5);
    addText('- Checklist assignment to properties', 5);
    yPosition += 10;

    addHeading('Support & Feedback');
    addText('If you encounter any issues or have questions during testing:');
    addText('Use the Support Chat bubble in the app to message Jason directly', 5);
    addText('Text: 248.798.3236', 5);
    addText('Email: jason@estatewatch365.com', 5);
    yPosition += 10;

    addText('Your feedback is critical to improving the platform. Please document any issues or suggestions and reach out!');

    // Generate and return PDF
    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=HomeWatch365-Testing-Instructions.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});