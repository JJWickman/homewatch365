import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { website_url } = await req.json();
    
    if (!website_url) {
      return Response.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Fetch the website HTML
    const response = await fetch(website_url);
    const html = await response.text();

    // Extract logo from common meta tags and patterns
    let logo_url = null;
    
    // Try favicon FIRST (user requirement: use favicon as default)
    const faviconMatch = html.match(/<link[^>]*rel=["'][^"']*icon["'][^>]*href=["']([^"']+)["']/i);
    if (faviconMatch) logo_url = faviconMatch[1];
    
    // Try og:image meta tag as fallback
    if (!logo_url) {
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImageMatch) logo_url = ogImageMatch[1];
    }
    
    // Try logo in schema.org JSON-LD
    if (!logo_url) {
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd.logo) logo_url = jsonLd.logo.url || jsonLd.logo;
        } catch {}
      }
    }
    
    // Try common image patterns
    if (!logo_url) {
      const imgMatch = html.match(/<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i);
      if (imgMatch) logo_url = imgMatch[1];
    }

    // Make logo URL absolute if relative
    if (logo_url && !logo_url.startsWith('http')) {
      const baseUrl = new URL(website_url);
      if (logo_url.startsWith('//')) {
        logo_url = baseUrl.protocol + logo_url;
      } else if (logo_url.startsWith('/')) {
        logo_url = baseUrl.origin + logo_url;
      } else {
        logo_url = baseUrl.origin + '/' + logo_url;
      }
    }

    // Extract colors from CSS and inline styles
    let primary_color = null;
    let accent_color = null;
    
    // Look for common color patterns in CSS
    const cssColors = html.match(/(?:background-color|color|border-color):\s*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\))/gi);
    
    if (cssColors && cssColors.length > 0) {
      const colorCounts = {};
      
      cssColors.forEach(match => {
        const color = match.split(':')[1].trim();
        // Skip very light or very dark colors
        if (!color.match(/#f{6}|#fff|#000000|#000|rgb\(255,\s*255,\s*255\)|rgb\(0,\s*0,\s*0\)/i)) {
          colorCounts[color] = (colorCounts[color] || 0) + 1;
        }
      });
      
      // Get most common colors
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color);
      
      if (sortedColors.length > 0) primary_color = sortedColors[0];
      if (sortedColors.length > 1) accent_color = sortedColors[1];
    }

    // Fallback: try theme-color meta tag
    if (!primary_color) {
      const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
      if (themeColorMatch) primary_color = themeColorMatch[1];
    }

    return Response.json({
      logo_url,
      primary_color,
      accent_color,
      success: true
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});