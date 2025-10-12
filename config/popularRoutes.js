/**
 * Popular Routes Configuration
 * Define commonly requested routes to pre-cache
 */

// Major hubs in KL/Selangor
const locations = {
    // Puchong areas
    puchongBandarPuteri: { lat: 3.0166, lon: 101.6206, name: 'Puchong Bandar Puteri' },
    puchongIOIMall: { lat: 3.0731, lon: 101.6076, name: 'Puchong IOI Mall' },
    
    // Subang Jaya
    subangJayaSS15: { lat: 3.0758, lon: 101.5917, name: 'Subang Jaya SS15' },
    subangEmpireGallery: { lat: 3.0745, lon: 101.5825, name: 'Subang Empire Gallery' },
    
    // KL City Center
    klSentral: { lat: 3.1337, lon: 101.6863, name: 'KL Sentral' },
    klcc: { lat: 3.1572, lon: 101.7122, name: 'KLCC / Petronas Towers' },
    pavilionKL: { lat: 3.1498, lon: 101.7130, name: 'Pavilion KL' },
    bukitBintang: { lat: 3.1478, lon: 101.7124, name: 'Bukit Bintang' },
    
    // Shopping areas
    midValley: { lat: 3.1176, lon: 101.6772, name: 'Mid Valley Megamall' },
    oneUtama: { lat: 3.1517, lon: 101.6148, name: '1 Utama' },
    sunwayPyramid: { lat: 3.0731, lon: 101.6076, name: 'Sunway Pyramid' },
    
    // Petaling Jaya
    pjSeapark: { lat: 3.1016, lon: 101.6275, name: 'PJ Sea Park' },
    pjSS2: { lat: 3.1177, lon: 101.6240, name: 'PJ SS2' },
    
    // Universities
    umMalaya: { lat: 3.1217, lon: 101.6556, name: 'University of Malaya' },
    
    // Airports
    klia: { lat: 2.7456, lon: 101.7099, name: 'KLIA' },
};

// Generate popular route pairs
export const popularRoutes = [];

// Transport modes to cache
const modes = ['car', 'bicycle', 'walking'];

// Puchong to KL routes
const puchongToKL = [
    { from: locations.puchongBandarPuteri, to: locations.klSentral },
    { from: locations.puchongBandarPuteri, to: locations.klcc },
    { from: locations.puchongBandarPuteri, to: locations.pavilionKL },
    { from: locations.puchongBandarPuteri, to: locations.midValley },
    { from: locations.puchongIOIMall, to: locations.klSentral },
];

// Subang to KL routes
const subangToKL = [
    { from: locations.subangJayaSS15, to: locations.klSentral },
    { from: locations.subangJayaSS15, to: locations.klcc },
    { from: locations.subangJayaSS15, to: locations.oneUtama },
    { from: locations.subangEmpireGallery, to: locations.klSentral },
];

// Within KL routes
const withinKL = [
    { from: locations.klSentral, to: locations.klcc },
    { from: locations.klSentral, to: locations.pavilionKL },
    { from: locations.klSentral, to: locations.bukitBintang },
    { from: locations.klcc, to: locations.pavilionKL },
    { from: locations.midValley, to: locations.klSentral },
];

// PJ to KL routes
const pjToKL = [
    { from: locations.pjSeapark, to: locations.klSentral },
    { from: locations.pjSS2, to: locations.klSentral },
    { from: locations.pjSeapark, to: locations.midValley },
];

// Shopping routes
const shopping = [
    { from: locations.sunwayPyramid, to: locations.midValley },
    { from: locations.oneUtama, to: locations.pavilionKL },
];

// Combine all route pairs
const allRoutePairs = [
    ...puchongToKL,
    ...subangToKL,
    ...withinKL,
    ...pjToKL,
    ...shopping
];

// Generate bidirectional routes for all modes
allRoutePairs.forEach(pair => {
    modes.forEach(mode => {
        // Forward direction
        popularRoutes.push({
            name: `${pair.from.name} → ${pair.to.name} (${mode})`,
            originLat: pair.from.lat,
            originLon: pair.from.lon,
            destLat: pair.to.lat,
            destLon: pair.to.lon,
            mode: mode
        });
        
        // Reverse direction
        popularRoutes.push({
            name: `${pair.to.name} → ${pair.from.name} (${mode})`,
            originLat: pair.to.lat,
            originLon: pair.to.lon,
            destLat: pair.from.lat,
            destLon: pair.from.lon,
            mode: mode
        });
    });
});

console.log(`📋 Configured ${popularRoutes.length} popular routes for caching`);

