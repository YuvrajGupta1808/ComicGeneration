#!/usr/bin/env node

/**
 * Test Database Integration
 * Tests the new database-backed comic generation workflow
 */

import chalk from 'chalk';
import prisma from './src/db/client.js';
import comicService from './src/services/comic-service.js';

async function test() {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  Database Integration Test'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  try {
    // Test 1: Get default user
    console.log(chalk.yellow('Test 1: Get default user'));
    const user = await prisma.user.findFirst({
      where: { email: 'admin@comic-backend.local' }
    });
    console.log(chalk.green(`✓ User found: ${user.email} (${user.id})\n`));

    // Test 2: Get all projects
    console.log(chalk.yellow('Test 2: Get all projects'));
    const projects = await prisma.project.findMany({
      include: {
        characters: true,
        panels: true
      }
    });
    console.log(chalk.green(`✓ Found ${projects.length} projects\n`));

    // Test 3: Get comic data for first project
    if (projects.length > 0) {
      const projectId = projects[0].id;
      console.log(chalk.yellow(`Test 3: Get comic data for project ${projectId}`));
      const comicData = await comicService.getComicData(projectId);
      console.log(chalk.green(`✓ Project: ${comicData.project.title}`));
      console.log(chalk.green(`  - Characters: ${comicData.characters.length}`));
      console.log(chalk.green(`  - Panels: ${comicData.panels.length}`));
      console.log(chalk.green(`  - Page Count: ${comicData.project.pageCount}\n`));

      // Test 4: Display first panel
      if (comicData.panels.length > 0) {
        console.log(chalk.yellow('Test 4: Display first panel'));
        const panel = comicData.panels[0];
        console.log(chalk.cyan(`  Panel ID: ${panel.id}`));
        console.log(chalk.cyan(`  Page: ${panel.pageNumber}, Panel: ${panel.panelNumber}`));
        console.log(chalk.cyan(`  Camera: ${panel.cameraAngle}`));
        console.log(chalk.cyan(`  Description: ${panel.description.substring(0, 100)}...`));
        console.log(chalk.cyan(`  Context Images: ${panel.contextImages.join(', ')}`));
        if (panel.dialogue.length > 0) {
          console.log(chalk.cyan(`  Dialogue: ${panel.dialogue.length} items`));
        }
        console.log(chalk.green('✓ Panel data retrieved successfully\n'));
      }

      // Test 5: Display characters
      if (comicData.characters.length > 0) {
        console.log(chalk.yellow('Test 5: Display characters'));
        comicData.characters.forEach(char => {
          console.log(chalk.cyan(`  ${char.id}: ${char.name || 'Unnamed'}`));
          console.log(chalk.gray(`    ${char.description.substring(0, 80)}...`));
        });
        console.log(chalk.green('✓ Character data retrieved successfully\n'));
      }
    }

    // Test 6: Database statistics
    console.log(chalk.yellow('Test 6: Database statistics'));
    const stats = {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      characters: await prisma.character.count(),
      panels: await prisma.panel.count(),
      dialogue: await prisma.dialogue.count(),
      layouts: await prisma.layout.count(),
      agentMemory: await prisma.agentMemory.count()
    };
    console.log(chalk.green('✓ Database Statistics:'));
    Object.entries(stats).forEach(([key, value]) => {
      console.log(chalk.cyan(`  ${key}: ${value}`));
    });

    console.log(chalk.green.bold('\n✅ All tests passed!\n'));

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
