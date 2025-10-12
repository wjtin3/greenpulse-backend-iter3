/**
 * Popular Transit Routes in Klang Valley
 * Pre-cache these routes for faster response times
 * 
 * Categories:
 * - Major transit hubs (LRT/MRT stations)
 * - Shopping malls
 * - Business districts (KLCC, Bangsar South, etc.)
 * - Residential areas (Subang Jaya, Puchong, etc.)
 * - Universities
 * - Airports
 */

export const popularTransitRoutes = [
    // ============================================
    // PETALING JAYA AREA
    // ============================================
    
    // Subang Jaya to KL
    {
        name: 'Subang Jaya (SS15) to KLCC',
        origin: { lat: 3.074, lon: 101.589, name: 'Subang Jaya SS15' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Subang Jaya (SS15) to KL Sentral',
        origin: { lat: 3.074, lon: 101.589, name: 'Subang Jaya SS15' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'Subang Jaya (SS15) to Bangsar',
        origin: { lat: 3.074, lon: 101.589, name: 'Subang Jaya SS15' },
        destination: { lat: 3.1284, lon: 101.6698, name: 'Bangsar' }
    },
    
    // Kelana Jaya area
    {
        name: 'Kelana Jaya LRT to KLCC',
        origin: { lat: 3.1133, lon: 101.6053, name: 'Kelana Jaya LRT' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Kelana Jaya LRT to KL Sentral',
        origin: { lat: 3.1133, lon: 101.6053, name: 'Kelana Jaya LRT' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'Kelana Jaya to Sunway Pyramid',
        origin: { lat: 3.1133, lon: 101.6053, name: 'Kelana Jaya LRT' },
        destination: { lat: 3.0742, lon: 101.6078, name: 'Sunway Pyramid' }
    },
    
    // Taman Bahagia / Sea Park area
    {
        name: 'Taman Bahagia to KLCC',
        origin: { lat: 3.1108, lon: 101.6129, name: 'Taman Bahagia' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Sea Park to KL Sentral',
        origin: { lat: 3.118, lon: 101.609, name: 'Sea Park' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    
    // Sunway area
    {
        name: 'Sunway Pyramid to KLCC',
        origin: { lat: 3.0742, lon: 101.6078, name: 'Sunway Pyramid' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Sunway Pyramid to KL Sentral',
        origin: { lat: 3.0742, lon: 101.6078, name: 'Sunway Pyramid' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'Sunway University to KLCC',
        origin: { lat: 3.0648, lon: 101.6027, name: 'Sunway University' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    
    // ============================================
    // PUCHONG AREA
    // ============================================
    
    {
        name: 'IOI Mall Puchong to KLCC',
        origin: { lat: 3.0481, lon: 101.6205, name: 'IOI Mall Puchong' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'IOI Mall Puchong to KL Sentral',
        origin: { lat: 3.0481, lon: 101.6205, name: 'IOI Mall Puchong' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'Bandar Puteri Puchong to KLCC',
        origin: { lat: 3.0166, lon: 101.6206, name: 'Bandar Puteri Puchong' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Puchong Jaya to KL Sentral',
        origin: { lat: 3.0347, lon: 101.6013, name: 'Puchong Jaya' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    
    // ============================================
    // KUALA LUMPUR CITY CENTER
    // ============================================
    
    // KLCC connections
    {
        name: 'KLCC to KL Sentral',
        origin: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'KLCC to Bangsar',
        origin: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' },
        destination: { lat: 3.1284, lon: 101.6698, name: 'Bangsar' }
    },
    {
        name: 'KLCC to Mid Valley',
        origin: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' },
        destination: { lat: 3.1185, lon: 101.6771, name: 'Mid Valley Megamall' }
    },
    {
        name: 'KLCC to Bukit Bintang',
        origin: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' },
        destination: { lat: 3.1478, lon: 101.7107, name: 'Bukit Bintang' }
    },
    
    // KL Sentral connections
    {
        name: 'KL Sentral to Bangsar',
        origin: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' },
        destination: { lat: 3.1284, lon: 101.6698, name: 'Bangsar' }
    },
    {
        name: 'KL Sentral to Mid Valley',
        origin: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' },
        destination: { lat: 3.1185, lon: 101.6771, name: 'Mid Valley Megamall' }
    },
    {
        name: 'KL Sentral to Bukit Bintang',
        origin: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' },
        destination: { lat: 3.1478, lon: 101.7107, name: 'Bukit Bintang' }
    },
    {
        name: 'KL Sentral to Pasar Seni',
        origin: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' },
        destination: { lat: 3.1446, lon: 101.6953, name: 'Pasar Seni' }
    },
    
    // Bukit Bintang area
    {
        name: 'Bukit Bintang to Bangsar',
        origin: { lat: 3.1478, lon: 101.7107, name: 'Bukit Bintang' },
        destination: { lat: 3.1284, lon: 101.6698, name: 'Bangsar' }
    },
    {
        name: 'Bukit Bintang to Mid Valley',
        origin: { lat: 3.1478, lon: 101.7107, name: 'Bukit Bintang' },
        destination: { lat: 3.1185, lon: 101.6771, name: 'Mid Valley Megamall' }
    },
    
    // ============================================
    // BANGSAR & MID VALLEY AREA
    // ============================================
    
    {
        name: 'Bangsar to Mid Valley',
        origin: { lat: 3.1284, lon: 101.6698, name: 'Bangsar' },
        destination: { lat: 3.1185, lon: 101.6771, name: 'Mid Valley Megamall' }
    },
    {
        name: 'Bangsar South to KLCC',
        origin: { lat: 3.1150, lon: 101.6678, name: 'Bangsar South' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Mid Valley to Sunway Pyramid',
        origin: { lat: 3.1185, lon: 101.6771, name: 'Mid Valley Megamall' },
        destination: { lat: 3.0742, lon: 101.6078, name: 'Sunway Pyramid' }
    },
    
    // ============================================
    // CHERAS AREA
    // ============================================
    
    {
        name: 'Cheras Leisure Mall to KLCC',
        origin: { lat: 3.1182, lon: 101.7401, name: 'Cheras Leisure Mall' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Cheras to KL Sentral',
        origin: { lat: 3.1182, lon: 101.7401, name: 'Cheras' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'Taman Connaught to KLCC',
        origin: { lat: 3.0914, lon: 101.7506, name: 'Taman Connaught' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    
    // ============================================
    // UNIVERSITIES
    // ============================================
    
    {
        name: 'Universiti Malaya to KLCC',
        origin: { lat: 3.1212, lon: 101.6538, name: 'Universiti Malaya' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Universiti Malaya to KL Sentral',
        origin: { lat: 3.1212, lon: 101.6538, name: 'Universiti Malaya' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'Monash University to KLCC',
        origin: { lat: 3.0644, lon: 101.6012, name: 'Monash University' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Taylor\'s University to KLCC',
        origin: { lat: 3.0650, lon: 101.5970, name: 'Taylor\'s University' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    
    // ============================================
    // AMPANG & SETIAWANGSA AREA
    // ============================================
    
    {
        name: 'Ampang Park to KLCC',
        origin: { lat: 3.1579, lon: 101.7169, name: 'Ampang Park' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Setiawangsa to KLCC',
        origin: { lat: 3.1716, lon: 101.7281, name: 'Setiawangsa' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Wangsa Maju to KL Sentral',
        origin: { lat: 3.2011, lon: 101.7353, name: 'Wangsa Maju' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    
    // ============================================
    // DAMANSARA & TTDI AREA
    // ============================================
    
    {
        name: 'Damansara Utama to KLCC',
        origin: { lat: 3.1358, lon: 101.6136, name: 'Damansara Utama' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'The Curve to KL Sentral',
        origin: { lat: 3.1490, lon: 101.6152, name: 'The Curve' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'TTDI to KLCC',
        origin: { lat: 3.1346, lon: 101.6330, name: 'TTDI' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Mutiara Damansara to KLCC',
        origin: { lat: 3.1537, lon: 101.6194, name: 'Mutiara Damansara' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    
    // ============================================
    // KEPONG & SENTUL AREA
    // ============================================
    
    {
        name: 'Kepong to KLCC',
        origin: { lat: 3.2188, lon: 101.6381, name: 'Kepong' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Sentul to KL Sentral',
        origin: { lat: 3.1820, lon: 101.6894, name: 'Sentul' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    
    // ============================================
    // SETAPAK & GOMBAK AREA
    // ============================================
    
    {
        name: 'Setapak to KLCC',
        origin: { lat: 3.1984, lon: 101.7296, name: 'Setapak' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Gombak to KL Sentral',
        origin: { lat: 3.2145, lon: 101.7093, name: 'Gombak' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    
    // ============================================
    // SHAH ALAM & KLANG AREA
    // ============================================
    
    {
        name: 'Shah Alam to KLCC',
        origin: { lat: 3.0853, lon: 101.5347, name: 'Shah Alam' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Shah Alam to KL Sentral',
        origin: { lat: 3.0853, lon: 101.5347, name: 'Shah Alam' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'Klang to KL Sentral',
        origin: { lat: 3.0333, lon: 101.4467, name: 'Klang' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    
    // ============================================
    // CYBERJAYA & PUTRAJAYA AREA
    // ============================================
    
    {
        name: 'Cyberjaya to KLCC',
        origin: { lat: 2.9199, lon: 101.6547, name: 'Cyberjaya' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    },
    {
        name: 'Putrajaya to KL Sentral',
        origin: { lat: 2.9264, lon: 101.6964, name: 'Putrajaya' },
        destination: { lat: 3.1333, lon: 101.6867, name: 'KL Sentral' }
    },
    {
        name: 'Putrajaya to KLCC',
        origin: { lat: 2.9264, lon: 101.6964, name: 'Putrajaya' },
        destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
    }
];

console.log(`📍 Loaded ${popularTransitRoutes.length} popular transit routes for pre-caching`);

export default popularTransitRoutes;

