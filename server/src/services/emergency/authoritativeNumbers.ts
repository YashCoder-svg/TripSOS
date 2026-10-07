export interface CountryEmergencyNumbers {
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string;
  general: string;
  police?: string;
  ambulance?: string;
  fire?: string;
  notes?: string;
  source: string;
}

// Authoritative numbers documented from ITU (International Telecommunication Union) and national public safety agencies
export const authoritativeEmergencyDirectory: Record<string, CountryEmergencyNumbers> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    general: '112',
    police: '100',
    ambulance: '108',
    fire: '101',
    notes: '112 is India’s unified National Emergency Response Support System (ERSS).',
    source: 'Ministry of Home Affairs, Government of India (ERSS)',
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    general: '911',
    police: '911',
    ambulance: '911',
    fire: '911',
    notes: 'Universal emergency number across all 50 states.',
    source: 'Federal Communications Commission (FCC 911 Service)',
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    general: '999',
    police: '999',
    ambulance: '999',
    fire: '999',
    notes: '112 is also routed directly to 999 services across the UK.',
    source: 'Ofcom / British Telecom Emergency Operator Services',
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    general: '911',
    police: '911',
    ambulance: '911',
    fire: '911',
    notes: 'Universal emergency number across provinces and territories.',
    source: 'Canadian Radio-television and Telecommunications Commission (CRTC)',
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    general: '000',
    police: '000',
    ambulance: '000',
    fire: '000',
    notes: '112 also routes from mobile phones to 000.',
    source: 'Australian Communications and Media Authority (ACMA)',
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    general: '112',
    police: '110',
    ambulance: '112',
    fire: '112',
    notes: '112 operates across the European Union.',
    source: 'European Emergency Number Association (EENA) / BBK Germany',
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    general: '112',
    police: '17',
    ambulance: '15',
    fire: '18',
    notes: '112 connects to emergency services in multiple languages.',
    source: 'French Ministry of the Interior / EENA',
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    general: '110',
    police: '110',
    ambulance: '119',
    fire: '119',
    notes: '110 for Police; 119 for Ambulance and Fire.',
    source: 'National Police Agency / Fire and Disaster Management Agency of Japan',
  },
  DEFAULT: {
    countryCode: 'INTL',
    countryName: 'International / Standard Global SOS',
    general: '112',
    police: '112',
    ambulance: '112',
    fire: '112',
    notes:
      '112 is the global GSM mobile standard emergency number and works on most mobile networks worldwide even without a SIM card.',
    source: 'International Telecommunication Union (ITU-T Recommendation E.161.1)',
  },
};

export function lookupEmergencyNumbers(countryOrCode?: string): CountryEmergencyNumbers {
  if (!countryOrCode) return authoritativeEmergencyDirectory.DEFAULT!;
  const key = countryOrCode.trim().toUpperCase();
  if (authoritativeEmergencyDirectory[key]) {
    return authoritativeEmergencyDirectory[key]!;
  }
  // Try matching country name
  for (const entry of Object.values(authoritativeEmergencyDirectory)) {
    if (entry.countryName.toUpperCase() === key) {
      return entry;
    }
  }
  return authoritativeEmergencyDirectory.DEFAULT!;
}
