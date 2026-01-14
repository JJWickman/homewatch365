import { base44 } from "@/api/base44Client";

/**
 * Validates a property address using Google Address Validation API
 * Returns validated address data with coordinates
 */
export async function validateAddress(addressData) {
  try {
    const { address, city, state, zip } = addressData;
    
    // Format address for validation
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    
    // Call backend function to validate address
    const response = await base44.functions.validatePropertyAddress({
      address: fullAddress,
      city,
      state,
      zip
    });
    
    if (response.valid) {
      return {
        valid: true,
        formattedAddress: response.formattedAddress,
        latitude: response.latitude,
        longitude: response.longitude,
        addressComponents: response.addressComponents
      };
    } else {
      return {
        valid: false,
        error: response.error || "Address could not be validated"
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message || "Address validation failed"
    };
  }
}