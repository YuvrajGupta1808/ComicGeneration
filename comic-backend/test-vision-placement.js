#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { DialoguePlacementVisionLangChainTool } from './src/tools/dialogue-placement-vision-langchain.js';

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
      dialogue: [
        { speaker: 'char_1', text: 'This place gives me the creeps.' },
        { speaker: 'char_2', text: 'Stay close. We need to find the artifact.' }
      ]
    },
    {
      id: 'panel_2',
      width: 832,
      height: 1248,
      imageUrl: 'https://res.cloudinary.com/ddzodimio/image/upload/v1762370062/comic/panels/panel_2.jpg',
      dialogue: [
        { speaker: 'char_1', text: 'Did you hear that?' }
      ]
    }
  ];

  const comicPath = path.join(__dirname, 'config/comic.yaml');
  const backupPath = comicPath + '.backup';

  if (fs.existsSync(comicPath)) await fs.copy(comicPath, backupPath);

  await fs.writeFile(comicPath, yaml.stringify({
    characters: [
      { id: 'char_1', name: 'Alex' },
      { id: 'char_2', name: 'Sam' }
    ],
    panels: testPanels
  }, { indent: 2 }));

  try {
    const tool = new DialoguePlacementVisionLangChainTool();
    const result = await tool.getTool().invoke({});
    
    console.log('📄 Full JSON Response:\n');
    console.log(result);
    console.log('\n' + '='.repeat(80) + '\n');
    
    const parsed = JSON.parse(result);

    if (parsed.success) {
      console.log(`✓ Analyzed ${parsed.analyzedPanels} panels\n`);
      parsed.placements.forEach(p => {
        console.log(p.panelId);
        p.placements.forEach((bubble, i) =>
          console.log(`  ${i + 1}. ${bubble.text} → (${bubble.position.x}, ${bubble.position.y})`)
        );
        console.log();
      });
    } else {
      console.log(`✗ ${parsed.error}`);
    }

  } catch (err) {
    console.error('❌', err.message);
  } finally {
    if (fs.existsSync(backupPath)) {
      await fs.move(backupPath, comicPath, { overwrite: true });
    }
  }
}

testVisionPlacement();