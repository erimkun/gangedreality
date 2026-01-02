/**
 * Pre-Assets Texture Scanner
 * Bu script textures klasöründeki dosyaları tarayıp materials.json dosyasını günceller
 * 
 * Kullanım: node scripts/scan-textures.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PRE_ASSETS_DIR = path.join(__dirname, '../public/pre-assets');
const TEXTURES_DIR = path.join(PRE_ASSETS_DIR, 'textures');
const MATERIALS_JSON = path.join(PRE_ASSETS_DIR, 'materials.json');

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Texture type detection from filename
const TEXTURE_TYPES = {
  diffuse: ['diffuse', 'color', 'albedo', 'base', 'basecolor'],
  normal: ['normal', 'nrm', 'norm'],
  roughness: ['roughness', 'rough', 'rgh'],
  metalness: ['metalness', 'metallic', 'metal', 'mtl'],
  ao: ['ao', 'ambient', 'occlusion'],
  height: ['height', 'displacement', 'disp', 'bump']
};

// Category detection from folder or filename
const CATEGORIES = {
  metal: ['metal', 'steel', 'iron', 'copper', 'gold', 'silver', 'bronze', 'chrome', 'aluminum'],
  wood: ['wood', 'oak', 'walnut', 'pine', 'mahogany', 'birch', 'maple', 'timber'],
  fabric: ['fabric', 'cloth', 'leather', 'velvet', 'cotton', 'linen', 'silk', 'wool'],
  stone: ['stone', 'marble', 'granite', 'concrete', 'rock', 'slate', 'tile'],
  plastic: ['plastic', 'rubber', 'vinyl', 'polymer'],
  glass: ['glass', 'crystal', 'transparent'],
};

function detectTextureType(filename) {
  const lower = filename.toLowerCase();
  for (const [type, keywords] of Object.entries(TEXTURE_TYPES)) {
    if (keywords.some(k => lower.includes(k))) {
      return type;
    }
  }
  return 'diffuse'; // Default
}

function detectCategory(filename) {
  const lower = filename.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) {
      return category;
    }
  }
  return 'other';
}

function generateMaterialName(filename) {
  // Remove extension and texture type suffixes
  let name = path.basename(filename, path.extname(filename));
  
  // Remove common suffixes
  const suffixes = [...Object.values(TEXTURE_TYPES).flat(), '1k', '2k', '4k', '8k'];
  for (const suffix of suffixes) {
    const regex = new RegExp(`[_-]?${suffix}$`, 'i');
    name = name.replace(regex, '');
  }
  
  // Clean up and capitalize
  name = name.replace(/[_-]/g, ' ').trim();
  name = name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  
  return name || 'Unnamed Material';
}

function scanTextures() {
  // Ensure directories exist
  if (!fs.existsSync(TEXTURES_DIR)) {
    fs.mkdirSync(TEXTURES_DIR, { recursive: true });
    console.log('📁 Created textures directory:', TEXTURES_DIR);
  }
  
  // Read existing materials.json
  let existingData = { materials: [], _info: '' };
  if (fs.existsSync(MATERIALS_JSON)) {
    try {
      existingData = JSON.parse(fs.readFileSync(MATERIALS_JSON, 'utf8'));
    } catch (e) {
      console.log('⚠️ Could not parse existing materials.json, starting fresh');
    }
  }
  
  // Keep track of existing material IDs
  const existingIds = new Set(existingData.materials.map(m => m.id));
  
  // Scan for texture files
  const files = fs.readdirSync(TEXTURES_DIR);
  const textureFiles = files.filter(f => 
    SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );
  
  console.log(`\n🔍 Found ${textureFiles.length} texture files\n`);
  
  // Group textures by material name
  const materialGroups = {};
  
  for (const file of textureFiles) {
    const materialName = generateMaterialName(file);
    const textureType = detectTextureType(file);
    
    if (!materialGroups[materialName]) {
      materialGroups[materialName] = {
        name: materialName,
        category: detectCategory(file),
        textures: {}
      };
    }
    
    materialGroups[materialName].textures[textureType] = `/pre-assets/textures/${file}`;
  }
  
  // Generate new materials
  const newMaterials = [];
  
  for (const [name, data] of Object.entries(materialGroups)) {
    const id = `scanned-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Skip if already exists
    if (existingIds.has(id)) {
      console.log(`⏭️  Skipping existing: ${name}`);
      continue;
    }
    
    const material = {
      id,
      name: data.name,
      category: data.category,
      metalness: data.category === 'metal' ? 1 : 0,
      roughness: data.category === 'glass' ? 0.1 : 0.5
    };
    
    // Add texture URLs
    if (data.textures.diffuse) {
      material.textureUrl = data.textures.diffuse;
      material.thumbnail = data.textures.diffuse;
    }
    if (data.textures.normal) {
      material.normalMapUrl = data.textures.normal;
    }
    if (data.textures.roughness) {
      material.roughnessMapUrl = data.textures.roughness;
    }
    if (data.textures.metalness) {
      material.metalnessMapUrl = data.textures.metalness;
    }
    
    newMaterials.push(material);
    console.log(`✅ Added: ${name} (${data.category})`);
  }
  
  // Merge with existing materials
  const allMaterials = [
    ...existingData.materials,
    ...newMaterials
  ];
  
  // Write updated materials.json
  const output = {
    materials: allMaterials,
    _info: "Bu dosya scan-textures.js scripti tarafından güncellenmiştir. Özel materyaller ekleyebilirsiniz.",
    _lastScanned: new Date().toISOString()
  };
  
  fs.writeFileSync(MATERIALS_JSON, JSON.stringify(output, null, 2), 'utf8');
  
  console.log(`\n✨ Done! Added ${newMaterials.length} new materials.`);
  console.log(`📄 Total materials: ${allMaterials.length}`);
  console.log(`📁 Output: ${MATERIALS_JSON}\n`);
}

// Run the scanner
scanTextures();
