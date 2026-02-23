# 🗺️ Local ArcGIS Vector Tile Server (Offline Portal Theme Support)

A lightweight **Node.js + Express** server that hosts **ArcGIS Vector Tiles (MBTiles)** locally and loads them inside the **ArcGIS Maps SDK for JavaScript** with full theme support — completely offline.

This project replicates how ArcGIS Portal serves vector tiles, but without requiring an internet connection.

------

## ✨ Features

- ✅ Serve `.mbtiles` vector or raster tiles locally
- ✅ Auto-detect bounds and zoom levels from MBTiles metadata
- ✅ WebMercator (WKID 3857) extent generation
- ✅ Local hosting of style JSON (e.g., Nova theme)
- ✅ ArcGIS JS 4.x SceneView demo included
- ✅ Load status indicator (online / offline / loading)
- ✅ Fully offline experience (no ArcGIS Portal dependency)

------

## 🏗 Architecture Overview

- **Backend**: Node.js + Express
- **Tile Reader**: `@mapbox/mbtiles`
- **Frontend**: ArcGIS Maps SDK for JavaScript 4.34
- **Projection**: WebMercator (EPSG:3857)

The workflow:

```
MBTiles (.mbtiles)
        ↓
Express Tile Server
        ↓
Local Style JSON (nova-style.json)
        ↓
ArcGIS VectorTileLayer
        ↓
SceneView
```

------

## 📦 Installation

### 1️⃣ Clone Repository

```
git clone https://github.com/yourusername/local-arcgis-vector-server.git
cd local-arcgis-vector-server
```

### 2️⃣ Install Dependencies

```
npm install
```

### 3️⃣ Add Your MBTiles File

Place your `.mbtiles` file inside:

```
/tiles/
```

Example:

```
/tiles/IslamabadVectorSample1-15.mbtiles
```

Make sure the filename matches:

```
const VECTOR_FILE = "IslamabadVectorSample1-15";
```

------

## ▶️ Running the Server

```
node index.mjs
```

Server will start at:

```
http://localhost:5567
```

------

## 🌍 Access Demo

Open in browser:

```
http://localhost:5567
```

You should see:

- Local vector tiles rendered
- Theme applied
- Status indicator showing load state

------

## 📥 Downloading Vector Tiles

Example ESRI vector tile source:

```
https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer
```

Tile format:

```
/tile/{z}/{y}/{x}.pbf
```

You can download tiles using:

👉 https://github.com/AliFlux/MapTilesDownloader

### MapTilesDownloader Setup

Inside:

```
MapTilesDownloader/src/UI/main.js
```

1. Add your free Mapbox token:

```
mapboxgl.accessToken = "YOUR_MAPBOX_TOKEN";
```

2. Add ESRI vector tile source URL in:

```
var sources = {
 "ESRI Vector": "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf"
}
```

------

## 🧠 How It Works

### 1️⃣ MBTiles Metadata Parsing

On startup, the server:

- Reads `bounds`
- Reads `minzoom` / `maxzoom`
- Converts WGS84 → WebMercator
- Generates ArcGIS-compatible extent

### 2️⃣ Tile Endpoints

Generic endpoint:

```
/tiles/:fileName/:level/:col/:row
```

Vector-specific endpoint:

```
/vtiles/:fileName/:z/:x/:y.pbf
```

### 3️⃣ Style Loading

The frontend loads style JSON from:

```
http://localhost:5567/Models/Novastyle/nova-style.json
```

The style references local `/vtiles/...` endpoints instead of ArcGIS Online.

------

## 📁 Project Structure

```
├── index.mjs
├── index.html
├── /tiles
│   └── IslamabadVectorSample1-15.mbtiles
├── /DynamicResource
│   └── Novastyle/
│       └── nova-style.json
└── package.json
```

------

## 🔧 Configuration

Inside `index.mjs`:

```json
const PORT = 5567;
const VECTOR_FILE = "IslamabadVectorSample1-15";
```
inside `\DynamicResource\NovaStyle\nova-style.json`

```json
{
  "version": 8,
  "sprite": "http://localhost:5567/Models/Novastyle/sprite",
  "glyphs": "http://localhost:5567/Models/Glyphs/{fontstack}/{range}.pbf",
  "sources": {
    "esri": {
      "type": "vector",
      "tiles": [
        "http://localhost:5567/vtiles/IslamabadVectorSample1-15/{z}/{x}/{y}.pbf"
      ]
    }
  },...
```


Change these to match your environment.

------

## ⚡ Performance Notes

Currently:

- MBTiles file is opened per request.

For high-traffic production use, consider:

- Singleton MBTiles instance reuse
- Tile response caching
- Gzip compression
- Reverse proxy (NGINX)

------

## 🔐 CORS Support

CORS is enabled to allow:

- Local development
- Cross-origin ArcGIS JS loading
- External testing environments

------

## 🎯 Use Cases

- Air-gapped environments
- Secure networks
- Electron Apps
- Simulation systems
- GIS desktop replacements
- Embedded mapping solutions
- Flight simulators
- Offline training systems

------

## 🧪 Tested With

- ArcGIS Maps SDK for JavaScript 4.34

- Node.js 18+

- Chrome / Edge

- Windows 10

# 🔤 ArcGIS Portal Font Downloader (Vector Tile Glyphs)

  A Node.js utility script that automatically downloads all **font glyph PBF files** used in an ArcGIS Portal Vector Tile style.

  This is required when running **ArcGIS Vector Tiles fully offline**, since the style JSON references glyph ranges hosted online.

------

  ## 🎯 Purpose

  When using a Portal vector tile style (for example the **Nova theme**), the style references font glyphs like:

  ```
  https://basemaps.arcgis.com/.../resources/fonts/{fontstack}/{range}.pbf
  ```

  In an **offline environment**, these glyph files must be downloaded locally.

  This script:

  1. Parses your downloaded `root.json`
  2. Detects all `text-font` entries
  3. Downloads required `.pbf` glyph ranges
  4. Saves them in a structured local directory

------

  ## 📥 Step 1 — Download the Root Style JSON

  You must first manually download the `root.json` of your Portal style.

  Example (Nova Theme):

  ```
  https://cdn.arcgis.com/sharing/rest/content/items/75f4dfdff19e445395653121a95a85db/resources/styles/root.json?f=json
  ```

  Save it locally as:

  ```
  ./root.json
  ```

------

  ## 📦 Installation

  No external dependencies required.

  Make sure you have:

  - Node.js 16+

------

  ## ⚙️ Configuration

  Inside `download-fonts.js`:

  ```
  const ROOT_JSON_PATH = './root.json';
  const OUTPUT_DIR = './public/fonts';
  const BASE_GLYPHS_URL = 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/resources/fonts';
  ```

  ### What these mean:

  | Variable          | Description                        |
  | ----------------- | ---------------------------------- |
  | `ROOT_JSON_PATH`  | Path to downloaded style root.json |
  | `OUTPUT_DIR`      | Where fonts will be saved          |
  | `BASE_GLYPHS_URL` | ArcGIS glyph service base URL      |

------

  ## ▶️ Running the Script

  ```
  node download-fonts.js
  ```

------

  ## 🧠 What the Script Does

  ### 1️⃣ Parse Style JSON

  It recursively scans `root.json` and finds:

  ```
  "text-font": ["Ubuntu Medium"]
  ```

  All unique fonts are collected automatically.

------

  ### 2️⃣ Download Unicode Glyph Ranges

  ArcGIS stores fonts in 256-character ranges:

  ```
  0-255.pbf
  256-511.pbf
  ...
  65280-65535.pbf
  ```

  The script downloads all ranges from:

  ```
  0 → 65535
  ```

  to ensure full character coverage.

------

  ### 3️⃣ Directory Structure Generated

  ```
  public/
  └── fonts/
      ├── Ubuntu Medium/
      │   ├── 0-255.pbf
      │   ├── 256-511.pbf
      │   └── ...
      └── Arial Unicode MS Regular/
          ├── 0-255.pbf
          └── ...
  ```

------

  ## 🌍 How To Use Fonts Offline

  After downloading:

  1. Host `/public/fonts` using your Express server
  2. Modify your style JSON glyph path:

  From:

  ```
  https://basemaps.arcgis.com/.../resources/fonts/{fontstack}/{range}.pbf
  ```

  To:

  ```
  http://localhost:5567/fonts/{fontstack}/{range}.pbf
  ```

  Now fonts load locally.

------

  ## ⚡ Performance Notes

  - Skips already downloaded files
  - Handles 404 ranges gracefully
  - Adds small delay to avoid hammering ArcGIS servers
  - Logs progress every 100 files

------

  ## 📌 Important Notes

  - Some fonts may not contain all ranges — 404 responses are normal.
  - Unicode beyond 65535 (rare scripts) is not covered.
  - Script is safe to rerun (will skip existing files).

------

  ## 🔐 Why This Is Required

  Without local glyphs:

  - Labels will not render
  - Text may disappear
  - Vector tiles may appear incomplete

  For **fully air-gapped environments**, glyph downloading is mandatory.

------

  ## 🧩 Works With

  - ArcGIS VectorTileLayer
  - ArcGIS Portal styles
  - Nova theme
  - Custom vector tile styles
  - Fully offline ArcGIS JS deployments

------

  ## 🚀 Recommended Workflow (Offline Setup)

  1. Download vector tiles → convert to MBTiles
  2. Download `root.json`
  3. Run `download-fonts.js`
  4. Host tiles + fonts locally
  5. Update style URLs
  6. Load in ArcGIS JS

------

## 📄 License

MIT License
