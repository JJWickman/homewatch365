/**
 * Backend function: Validates property address using Google Address Validation API
 * This runs securely on the server side with API key protection
 */

export async function validatePropertyAddress(req) {
  const { address, city, state, zip } = req.body;
  const apiKey = process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY;

  if (!apiKey) {
    return {
      valid: false,
      error: "Address validation service not configured"
    };
  }

  try {
    // Google Address Validation API endpoint
    const url = "https://addressvalidation.googleapis.com/v1:validateAddress";
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: {
          addressLines: [address],
          administrativeArea: state,
          locality: city,
          postalCode: zip,
          regionCode: "US"
        }
      }),
      searchParams: {
        key: apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.result;

    // Check if address was validated
    if (result?.verdict?.validationGranularity === "PREMISE" || 
        result?.verdict?.validationGranularity === "STREET_ADDRESS") {
      
      const geocode = result.geocode;
      const formattedAddress = result.address?.formattedAddress;

      return {
        valid: true,
        formattedAddress: formattedAddress || `${address}, ${city}, ${state} ${zip}`,
        latitude: geocode?.location?.latitude,
        longitude: geocode?.location?.longitude,
        addressComponents: {
          postalCode: result.address?.postalCode,
          administrativeArea: result.address?.administrativeArea,
          locality: result.address?.locality
        }
      };
    } else {
      return {
        valid: false,
        error: "Address could not be fully validated. Please check the address and try again.",
        validationGranularity: result?.verdict?.validationGranularity
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `Address validation error: ${error.message}`
    };
  }
}