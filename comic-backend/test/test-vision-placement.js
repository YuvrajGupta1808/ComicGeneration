#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { DialoguePlacementVisionLangChainTool } from '../src/tools/dialogue-placement-vision-langchain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from comic-backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testVisionPlacement() {
  console.log('🎯 Testing Dialogue Placement\n');

  const testPanels = [
    {
      id: 'panel_1',
      width: 832,
      height: 1248,
      imageUrl: 'https://res.cloudinary.com/ddzodimio/image/upload/v1762370033/comic/panels/panel_1.jpg',
      title: 'THE DESOLATE OUTPOST',
      dialogue: [
        { speaker: 'char_1', text: 'This place gives me the creeps.' },
        { speaker: 'char_2', text: 'Stay close. We need to find the artifact.' }
      ],
      narration: 'On a forgotten planet at the edge of known space, two unlikely allies search for a legendary relic.'
    },
    {
      id: 'panel_2',
      width: 832,
      height: 1248,
      imageUrl: 'https://res.cloudinary.com/ddzodimio/image/upload/v1762370062/comic/panels/panel_2.jpg',
      dialogue: [
        { speaker: 'char_1', text: 'Did you hear that?' }
      ],
      narration: 'Something stirs in the shadows...'
    }
  ];

  const comicPath = path.join(__dirname, 'config/comic.yaml');
  const backupPath = comicPath + '.backup';

  if (fs.existsSync(comicPath)) await fs.copy(comicPath, backupPath);

  // Save test comic data WITH dialogue (as dialogue generation tool would)
  await fs.writeFile(comicPath, yaml.stringify({
    characters: [
      { id: 'char_1', name: 'Alex' },
      { id: 'char_2', name: 'Sam' }
    ],
    panels: testPanels.map(p => ({
      id: p.id,
      width: p.width,
      height: p.height,
      imageUrl: p.imageUrl,
      title: p.title || null,
      dialogue: p.dialogue || [],
      narration: p.narration || null
    }))
  }, { indent: 2 }));

  // No need to save to dialogue.yaml - dialogue is now in comic.yaml
  // (keeping backup logic for cleanup)

  try {
    const tool = new DialoguePlacementVisionLangChainTool();
    const result = await tool.getTool().invoke({});
    
    console.log('📄 Full JSON Response:\n');
    console.log(result);
    console.log('\n' + '='.repeat(80) + '\n');
    
    const parsed = JSON.parse(result);

    if (parsed.success) {
      console.log(`✓ Analyzed ${parsed.analyzedPanels} panels\n`);
      
      // Show placements
      parsed.placements.forEach(p => {
        console.log(`📐 ${p.panelId}:`);
        p.placements.forEach((bubble, i) => {
          const type = bubble.type === 'title' ? '📖' : bubble.type === 'narration' ? '📜' : '💬';
          console.log(`  ${type} ${i + 1}. ${bubble.text.substring(0, 50)}... → (${bubble.position.x}, ${bubble.position.y})`);
        });
        console.log();
      });
      
      // Show rendered images
      if (parsed.renderedImages && parsed.renderedImages.length > 0) {
        console.log('🎨 Rendered Images:');
        parsed.renderedImages.forEach(img => {
          if (img.cloudinaryUrl) {
            console.log(`  ✓ ${img.panelId}: ${img.cloudinaryUrl}`);
          } else if (img.error) {
            console.log(`  ✗ ${img.panelId}: ${img.error}`);
          }
        });
        console.log();
      }
      
      // Verify textImageUrl was saved to comic.yaml
      const updatedComic = yaml.parse(fs.readFileSync(comicPath, 'utf8'));
      const panelsWithText = updatedComic.panels.filter(p => p.textImageUrl);
      console.log(`✅ ${panelsWithText.length} panels have textImageUrl saved in comic.yaml`);
      
    } else {
      console.log(`✗ ${parsed.error}`);
    }

  } catch (err) {
    console.error('❌', err.message);
  } finally {
    // Restore backups
    if (fs.existsSync(backupPath)) {
      await fs.move(backupPath, comicPath, { overwrite: true });
    }
    const dialoguePath = path.join(__dirname, 'config/dialogue.yaml');
    const dialogueBackupPath = dialoguePath + '.backup';
    if (fs.existsSync(dialogueBackupPath)) {
      await fs.move(dialogueBackupPath, dialoguePath, { overwrite: true });
    }
  }
}

testVisionPlacement();