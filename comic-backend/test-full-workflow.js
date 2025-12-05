#!/usr/bin/env node

/**
 * Full Workflow Test
 * Tests the complete comic generation workflow with database integration
 */

import chalk from 'chalk';
import prisma from './src/db/client.js';
import comicService from './src/services/comic-service.js';
import { CharacterGenerationLangChainTool } from './src/tools/character-generation-langchain.js';
import { DialogueGenerationLangChainTool } from './src/tools/dialogue-generation-langchain.js';
import { PanelGenerationLangChainTool } from './src/tools/panel-generation-langchain.js';

async function test() {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  Full Workflow Test'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  let projectId = null;

  try {
    // Step 1: Generate Panels
    console.log(chalk.yellow('Step 1: Generate Panels'));
    const panelTool = new PanelGenerationLangChainTool();
    const panelResult = await panelTool.execute(
      null, // No project ID - will create new
      'A robot discovers emotions for the first time',
      'sci-fi',
      3
    );
    
    const panelData = JSON.parse(panelResult);
    if (!panelData.success) {
      throw new Error(`Panel generation failed: ${panelData.error}`);
    }
    
    projectId = panelData.projectId;
    console.log(chalk.green(`✓ Generated ${panelData.totalPanels} panels`));
    console.log(chalk.cyan(`  Project ID: ${projectId}\n`));

    // Step 2: Generate Characters
    console.log(chalk.yellow('Step 2: Generate Characters'));
    const characterTool = new CharacterGenerationLangChainTool();
    const characterResult = await characterTool.execute(
      projectId,
      'A robot learning about emotions',
      'sci-fi'
    );
    
    const characterData = JSON.parse(characterResult);
    if (!characterData.success) {
      throw new Error(`Character generation failed: ${characterData.error}`);
    }
    
    console.log(chalk.green(`✓ Generated ${characterData.characterCount} characters\n`));

    // Step 3: Generate Dialogue
    console.log(chalk.yellow('Step 3: Generate Dialogue'));
    const dialogueTool = new DialogueGenerationLangChainTool();
    const dialogueResult = await dialogueTool.execute(
      projectId,
      'sci-fi',
      'thoughtful',
      'A robot discovering emotions'
    );
    
    const dialogueData = JSON.parse(dialogueResult);
    if (!dialogueData.success) {
      throw new Error(`Dialogue generation failed: ${dialogueData.error}`);
    }
    
    console.log(chalk.green(`✓ Generated dialogue for ${dialogueData.totalPanels} panels\n`));

    // Step 4: Verify Database
    console.log(chalk.yellow('Step 4: Verify Database'));
    const comicData = await comicService.getComicData(projectId);
    
    console.log(chalk.green('✓ Database Verification:'));
    console.log(chalk.cyan(`  Project: ${comicData.project.title}`));
    console.log(chalk.cyan(`  Characters: ${comicData.characters.length}`));
    console.log(chalk.cyan(`  Panels: ${comicData.panels.length}`));
    console.log(chalk.cyan(`  Dialogue Items: ${comicData.panels.reduce((sum, p) => sum + p.dialogue.length, 0)}`));
    
    // Display first panel
    if (comicData.panels.length > 0) {
      const panel = comicData.panels[0];
      console.log(chalk.cyan(`\n  First Panel:`));
      console.log(chalk.gray(`    ID: ${panel.id}`));
      console.log(chalk.gray(`    Title: ${panel.title || 'None'}`));
      console.log(chalk.gray(`    Description: ${panel.description.substring(0, 80)}...`));
      console.log(chalk.gray(`    Camera: ${panel.cameraAngle}`));
      console.log(chalk.gray(`    Context: ${panel.contextImages.join(', ')}`));
    }
    
    // Display first character
    if (comicData.characters.length > 0) {
      const char = comicData.characters[0];
      console.log(chalk.cyan(`\n  First Character:`));
      console.log(chalk.gray(`    ID: ${char.id}`));
      console.log(chalk.gray(`    Name: ${char.name || 'Unnamed'}`));
      console.log(chalk.gray(`    Description: ${char.description.substring(0, 80)}...`));
    }

    console.log(chalk.green.bold('\n✅ Full workflow test passed!\n'));
    console.log(chalk.cyan(`Project ID: ${projectId}`));
    console.log(chalk.gray('You can now run image generation and page composition on this project.\n'));

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Test failed!'));
    console.error(chalk.red(error.message));
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
