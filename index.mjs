/**
 * ArcGIS Vector Tiles host for ArcGIS JS *
 * This server hosts vector files as done by Arcgis Portal
 * In this sample Nova theme hosted on portal is now locally loaded for full offline experience
 * A sample index.html is attached to use the locally hosted vector tiles.
 * the tiles can be downloaded from "ESRI Vector": "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf"
 * To download tiles use https://github.com/AliFlux/MapTilesDownloader
 * in MapTilesDownloader/src/UI/main.js > add your mapboxjs api key which is free at mapboxgl.accessToken
 * in MapTilesDownloader/src/UI/main.js > add the ESRI Elevation URL above to var sources = {...
 * Run: node run start
 * Orignal online sample is located in indexSample.html
 */

import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import MBTiles from "@mapbox/mbtiles";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5567;
const VECTOR_FILE = "IslamabadVectorSample1-15";

const CONFIG = {
  port: 3001,
  mbtilesServer: `http://localhost:${PORT}`,
  mbtilesPath: `/tiles/${VECTOR_FILE}`,
  serviceName: "LocalVectorTiles",
  description: "Locally hosted vector tiles",
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║      Locally Hosted ArcGIS Vector Tiles with Portal Theme      ║
╠════════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                      ║
║                                                                ║
║  Demo Page: http://localhost:${PORT}                              ║
╚════════════════════════════════════════════════════════════════╝
`);

/* ---------- Utilities ---------- */
function lonLatToWebMercator(lon, lat) {
  const x = (lon * 20037508.34) / 180;
  const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  return { x, y: (y * 20037508.34) / 180 };
}

/* ---------- Express Setup ---------- */
const app = express();
app.use(cors());
app.listen(PORT, () => console.log(`Server now running on ${PORT}`));

/* ---------- MBTiles Singleton ---------- */
const MBTILES_PATH = path.join("./tiles/", `${VECTOR_FILE}.mbtiles`);
let serviceExtent = null;

new MBTiles(`${MBTILES_PATH}?mode=ro`, (err, mbtiles) => {
  if (err) return console.error("MBTiles open error:", err);

  mbtiles.getInfo((infoErr, info) => {
    if (infoErr || !info.bounds) return;

    const [minLon, minLat, maxLon, maxLat] = info.bounds;
    const min = lonLatToWebMercator(minLon, minLat);
    const max = lonLatToWebMercator(maxLon, maxLat);

    serviceExtent = {
      xmin: min.x,
      ymin: min.y,
      xmax: max.x,
      ymax: max.y,
      spatialReference: { wkid: 3857 },
    };
    global.mbtilesZoomRange = [info.minzoom, info.maxzoom];

    console.log(
      "✅ Auto extent & LOD range loaded:",
      serviceExtent,
      global.mbtilesZoomRange,
    );
  });
});

/* ---------- Routes ---------- */
const TILES_DIR = "./tiles/";

// Generic MBTiles tile route (vector or raster)
app.get("/tiles/:fileName/:level/:col/:row", (req, res) => {
  const { fileName, level, col, row } = req.params;
  const mbtilesPath = path.join(TILES_DIR, `${fileName}.mbtiles`);

  new MBTiles(`${mbtilesPath}?mode=ro`, (err, mbtiles) => {
    if (err) return res.status(500).send("Failed to open mbtiles file");

    mbtiles.getTile(level, col, row, (tileErr, tile, headers) => {
      if (tileErr) return res.status(404).send("Tile not found");
      res.set(headers);
      res.send(tile);
    });
  });
});

// Vector-tile specific route (z/x/y.pbf)
app.get("/vtiles/:fileName/:z/:x/:y.pbf", (req, res) => {
  const { fileName, z, x, y } = req.params;
  const mbtilesPath = path.join(TILES_DIR, `${fileName}.mbtiles`);

  new MBTiles(`${mbtilesPath}?mode=ro`, (err, mbtiles) => {
    if (err) return res.status(500).send("Failed to open mbtiles file");

    mbtiles.getTile(z, x, y, (tileErr, tile, headers) => {
      if (tileErr) return res.status(404).send("Tile not found");
      res.set(headers);
      res.send(tile);
    });
  });
});

/* ---------- Static Assets ---------- */
let staticFolder = path.join(__dirname, "DynamicResource");
if (!fs.existsSync(staticFolder))
  staticFolder = path.join(__dirname, "DynamicResource");

app.use("/Models", express.static(staticFolder));

// List files in subdirectory
//http://localhost:5566/list-files?path=DynamicResource/
app.get("/list-files", (req, res) => {
  const dir = path.join(__dirname, req.query.path || "");
  fs.readdir(dir, (err, files) =>
    err ? res.status(500).send("Error reading folder") : res.json(files),
  );
});

// Single file download
app.get("/Models/:filename", (req, res) => {
  const filePath = path.join(staticFolder, req.params.filename);
  res.sendFile(filePath, () => res.status(404).send("File not found"));
});

/* ---------- Fallback ---------- */
app.use(express.static(__dirname));
