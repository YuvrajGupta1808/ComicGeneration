#!/usr/bin/env node

/**
 * Workflow Verification Script
 * Verifies the complete dialogue → placement → compose workflow
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Comic Generation Workflow\n');
console.log('='.repeat(60));

// Check 1: comic.yaml structure
console.log('\n📋 Check 1: comic.yaml Structure');
const comicPath = path.join(__dirname, 'config/comic.yaml');

if (!fs.existsSync(comicPath)) {
  console.log('❌ comic.yaml not found');
  process.exit(1);
}

const comic = yaml.parse(fs.readFileSync(comicPath, 'utf8'));

console.log(`✓ Found ${comic.characters?.length || 0} characters`);
console.log(`✓ Found ${comic.panels?.length || 0} panels`);

// Check 2: Dialogue in panels
console.log('\n💬 Check 2: Dialogue Data in Panels');
const panelsWithDialogue = comic.panels?.filter(p => 
  p.dialogue?.length > 0 || p.title || p.narration
) || [];

console.log(`✓ ${panelsWithDialogue.length} panels have text content (dialogue/title/narration)`);

if (panelsWithDialogue.length > 0) {
  console.log('\n  Sample panel with dialogue:');
  const sample = panelsWithDialogue[0];
  console.log(`  - Panel ID: ${sample.id}`);
  if (sample.title) console.log(`  - Title: "${sample.title}"`);
  if (sample.dialogue?.length > 0) {
    console.log(`  - Dialogue: ${sample.dialogue.length} lines`);
    sample.dialogue.forEach((d, i) => {
      console.log(`    ${i + 1}. ${d.speaker}: "${d.text.substring(0, 40)}..."`);
    });
  }
  if (sample.narration) console.log(`  - Narration: "${sample.narration.substring(0, 50)}..."`);
}

// Check 3: Image URLs
console.log('\n🖼️  Check 3: Panel Image URLs');
const panelsWithImages = comic.panels?.filter(p => p.imageUrl || p.cloudinaryUrl) || [];
console.log(`✓ ${panelsWithImages.length} panels have imageUrl`);

if (panelsWithImages.length > 0) {
  console.log(`  Sample: ${panelsWithImages[0].imageUrl || panelsWithImages[0].cloudinaryUrl}`);
}

// Check 4: Text placements
console.log('\n🎯 Check 4: Text Placements (from dialogue placement tool)');
const panelsWithPlacements = comic.panels?.filter(p => p.textPlacements?.length > 0) || [];
console.log(`✓ ${panelsWithPlacements.length} panels have textPlacements`);

if (panelsWithPlacements.length > 0) {
  const sample = panelsWithPlacements[0];
  console.log(`  Sample panel: ${sample.id}`);
  console.log(`  - Placements: ${sample.textPlacements.length}`);
  sample.textPlacements.forEach((p, i) => {
    console.log(`    ${i + 1}. ${p.type}: "${p.text.substring(0, 30)}..." at (${p.position.x}, ${p.position.y})`);
  });
}

// Check 5: Text image URLs
console.log('\n📝 Check 5: Text Image URLs (images with rendered text)');
const panelsWithTextImages = comic.panels?.filter(p => p.textImageUrl) || [];
console.log(`✓ ${panelsWithTextImages.length} panels have textImageUrl`);

if (panelsWithTextImages.length > 0) {
  console.log(`  Sample: ${panelsWithTextImages[0].textImageUrl}`);
}

// Check 6: Workflow readiness
console.log('\n🔄 Check 6: Workflow Readiness');

const hasCharacters = comic.characters?.length > 0;
const hasPanels = comic.panels?.length > 0;
const hasDialogue = panelsWithDialogue.length > 0;
const hasImages = panelsWithImages.length > 0;
const hasTextImages = panelsWithTextImages.length > 0;

console.log(`  Characters generated: ${hasCharacters ? '✅' : '❌'}`);
console.log(`  Panels generated: ${hasPanels ? '✅' : '❌'}`);
console.log(`  Dialogue generated: ${hasDialogue ? '✅' : '❌'}`);
console.log(`  Images generated: ${hasImages ? '✅' : '❌'}`);
console.log(`  Text rendered on images: ${hasTextImages ? '✅' : '❌'}`);

// Workflow status
console.log('\n📊 Workflow Status:');

if (!hasCharacters || !hasPanels) {
  console.log('⚠️  Need to generate characters and panels first');
} else if (!hasDialogue) {
  console.log('⚠️  Ready for dialogue generation');
} else if (!hasImages) {
  console.log('⚠️  Ready for image generation (Leonardo AI)');
} else if (!hasTextImages) {
  console.log('⚠️  Ready for dialogue placement (will render text on images)');
} else {
  console.log('✅ Ready for page composition!');
  console.log('   The compose tool will automatically use images with text.');
}

// Check 7: Compose tool compatibility
console.log('\n🎨 Check 7: Compose Tool Compatibility');

if (hasTextImages) {
  console.log('✅ Compose tool will use textImageUrl (images with text)');
  console.log(`   ${panelsWithTextImages.length} panels have rendered text`);
} else if (hasImages) {
  console.log('⚠️  Compose tool will use imageUrl (original images without text)');
  console.log('   Run dialogue placement to add text to images');
} else {
  console.log('❌ No images available for composition');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📈 Summary:');
console.log(`   Characters: ${comic.characters?.length || 0}`);
console.log(`   Panels: ${comic.panels?.length || 0}`);
console.log(`   Panels with dialogue: ${panelsWithDialogue.length}`);
console.log(`   Panels with images: ${panelsWithImages.length}`);
console.log(`   Panels with text images: ${panelsWithTextImages.length}`);

if (hasCharacters && hasPanels && hasDialogue && hasImages && hasTextImages) {
  console.log('\n✅ WORKFLOW IS COMPLETE AND ALIGNED');
  console.log('   All data flows correctly through comic.yaml');
  console.log('   Compose tool will use images with rendered text');
} else {
  console.log('\n⚠️  WORKFLOW IN PROGRESS');
  console.log('   Continue with the next step in the workflow');
}

console.log('='.repeat(60) + '\n');
