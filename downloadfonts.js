// download-fonts.js
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_JSON_PATH = './root.json'; // Path to your downloaded root.json
const OUTPUT_DIR = './public/fonts';  // Where to save fonts
const BASE_GLYPHS_URL = 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/resources/fonts';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 1. Read root.json to find which fonts are used
const rawJson = fs.readFileSync(ROOT_JSON_PATH);
const styleJson = JSON.parse(rawJson);

const uniqueFonts = new Set();

// Recursive function to find "text-font" properties
function findFonts(obj) {
    if (!obj) return;
    if (Array.isArray(obj)) {
        obj.forEach(findFonts);
    } else if (typeof obj === 'object') {
        if (obj['text-font']) {
            // text-font is usually an array like ["Ubuntu Medium"]
            obj['text-font'].forEach(f => uniqueFonts.add(f));
        }
        Object.values(obj).forEach(findFonts);
    }
}

findFonts(styleJson);

console.log(`Found ${uniqueFonts.size} fonts to download:`, [...uniqueFonts]);

// 2. Download helper
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        // Skip if exists
        if (fs.existsSync(dest)) return resolve();
        
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                // If 404, it just means that range doesn't exist for this font, not an error
                if (response.statusCode === 404) return resolve(); 
                return reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {}); // Delete partial file
            reject(err);
        });
    });
}

// 3. Download the PBF files (ranges 0-65535 usually covers all standard chars)
// We will download ranges 0-255, 256-511... up to 65535 to be safe.
// We do this concurrently but with a limit to avoid hammering the server.

async function downloadAllFonts() {
    const fontList = [...uniqueFonts];
    
    // Standard Unicode ranges to download (0 to 65535)
    // Note: In the URL, range is formatted like "0-255"
    const ranges = [];
    for (let i = 0; i < 256; i++) { 
        const start = i * 256;
        const end = start + 255;
        ranges.push(`${start}-${end}`);
    }

    let count = 0;
    
    for (const font of fontList) {
        const fontDir = path.join(OUTPUT_DIR, font);
        if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir, { recursive: true });
        
        console.log(`Downloading font: ${font}...`);
        
        for (const range of ranges) {
            const fileName = `${range}.pbf`;
            const url = `${BASE_GLYPHS_URL}/${encodeURIComponent(font)}/${fileName}`;
            const dest = path.join(fontDir, fileName);
            
            // Simple delay to be nice to the server
            await new Promise(r => setTimeout(r, 10)); 
            
            await downloadFile(url, dest).catch(e => console.log(`Skipped range ${range} for ${font}`));
            
            count++;
            if(count % 100 === 0) console.log(`Processed ${count} files...`);
        }
    }
    
    console.log('Done!');
}

downloadAllFonts();