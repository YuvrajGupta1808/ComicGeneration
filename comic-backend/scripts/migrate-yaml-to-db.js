#!/usr/bin/env node

/**
 * YAML to Database Migration Script
 * Migrates existing comic.yaml, characters.yaml, and layouts.yaml to PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Create a default user for migration
 */
async function createDefaultUser() {
  try {
    const user = await prisma.user.upsert({
      where: { email: 'admin@comic-backend.local' },
      update: {},
      create: {
        email: 'admin@comic-backend.local',
        passwordHash: 'temp_hash_change_in_production',
        name: 'Admin User',
        tier: 'pro'
      }
    });
    console.log(chalk.green(`✓ User created/found: ${user.email} (${user.id})`));
    return user;
  } catch (error) {
    console.error(chalk.red('Failed to create user:'), error.message);
    throw error;
  }
}

/**
 * Migrate layouts.yaml to database
 */
async function migrateLayouts() {
  try {
    const layoutsPath = path.join(__dirname, '../config/layouts.yaml');
    
    if (!fs.existsSync(layoutsPath)) {
      console.log(chalk.yellow('⚠️  layouts.yaml not found, skipping...'));
      return;
    }

    const layoutsFile = fs.readFileSync(layoutsPath, 'utf8');
    const layoutsData = yaml.parse(layoutsFile);

    if (!layoutsData.layouts) {
      console.log(chalk.yellow('⚠️  No layouts found in layouts.yaml'));
      return;
    }

    console.log(chalk.cyan('\n📐 Migrating Layouts...'));

    for (const [layoutName, layoutConfig] of Object.entries(layoutsData.layouts)) {
      const pageCount = layoutConfig.panels_per_page?.length || 3;
      
      const layout = await prisma.layout.upsert({
        where: { name: layoutName },
        update: {
          pageCount,
          panelsPerPage: JSON.stringify(layoutConfig.panels_per_page || []),
          layoutData: JSON.stringify(layoutConfig)
        },
        create: {
          name: layoutName,
          pageCount,
          panelsPerPage: JSON.stringify(layoutConfig.panels_per_page || []),
          layoutData: JSON.stringify(layoutConfig)
        }
      });

      console.log(chalk.green(`  ✓ Layout: ${layoutName} (${pageCount} pages)`));
    }

    console.log(chalk.green(`✓ Migrated ${Object.keys(layoutsData.layouts).length} layouts`));
  } catch (error) {
    console.error(chalk.red('Failed to migrate layouts:'), error.message);
    throw error;
  }
}

/**
 * Migrate comic.yaml to database
 */
async function migrateComicYaml(userId, comicYamlPath, projectTitle = 'Migrated Project') {
  try {
    if (!fs.existsSync(comicYamlPath)) {
      console.log(chalk.yellow(`⚠️  ${comicYamlPath} not found, skipping...`));
      return null;
    }

    const comicFile = fs.readFileSync(comicYamlPath, 'utf8');
    const comicData = yaml.parse(comicFile);

    if (!comicData.panels || comicData.panels.length === 0) {
      console.log(chalk.yellow('⚠️  No panels found in comic.yaml'));
      return null;
    }

    console.log(chalk.cyan(`\n📖 Migrating Comic: ${projectTitle}...`));

    // Detect page count from panels
    const totalPanels = comicData.panels.length;
    let pageCount = 3;
    if (totalPanels <= 8) pageCount = 3;
    else if (totalPanels <= 12) pageCount = 4;
    else pageCount = 5;

    // Create project
    const project = await prisma.project.create({
      data: {
        userId,
        title: projectTitle,
        pageCount,
        status: 'completed'
      }
    });

    console.log(chalk.green(`  ✓ Project created: ${project.title} (${project.id})`));

    // Migrate characters
    if (comicData.characters && comicData.characters.length > 0) {
      console.log(chalk.cyan(`\n  👥 Migrating ${comicData.characters.length} characters...`));
      
      for (const char of comicData.characters) {
        const character = await prisma.character.create({
          data: {
            projectId: project.id,
            characterId: char.id,
            name: char.name || char.id,
            description: char.description || '',
            prompt: char.prompt || char.description || '',
            width: char.width || 832,
            height: char.height || 1248,
            contextImages: JSON.stringify(char.contextImages || []),
            imageUrl: char.imageUrl || null,
            leonardoId: char.leonardoId || null
          }
        });

        console.log(chalk.green(`    ✓ Character: ${character.characterId} (${character.name || 'unnamed'})`));
      }
    }

    // Migrate panels
    console.log(chalk.cyan(`\n  📐 Migrating ${comicData.panels.length} panels...`));
    
    let pageNumber = 1;
    let panelNumber = 1;
    const panelsPerPage = pageCount === 3 ? [3, 3, 2] : pageCount === 4 ? [3, 3, 3, 3] : [3, 3, 3, 3, 2];

    for (let i = 0; i < comicData.panels.length; i++) {
      const panel = comicData.panels[i];
      
      // Determine page and panel number
      let currentPanelCount = 0;
      let currentPage = 1;
      let currentPanelNum = 1;
      
      for (let p = 0; p < panelsPerPage.length; p++) {
        if (i < currentPanelCount + panelsPerPage[p]) {
          currentPage = p + 1;
          currentPanelNum = i - currentPanelCount + 1;
          break;
        }
        currentPanelCount += panelsPerPage[p];
      }

      const createdPanel = await prisma.panel.create({
        data: {
          projectId: project.id,
          panelId: panel.id,
          pageNumber: currentPage,
          panelNumber: currentPanelNum,
          description: panel.description || '',
          prompt: panel.prompt || panel.description || '',
          cameraAngle: panel.cameraAngle || 'medium-shot',
          width: panel.width || 832,
          height: panel.height || 1248,
          contextImages: JSON.stringify(panel.contextImages || []),
          imageUrl: panel.imageUrl || null,
          textImageUrl: panel.textImageUrl || null,
          leonardoId: panel.leonardoId || null,
          title: panel.title || null,
          narration: panel.narration || null,
          soundEffects: JSON.stringify(panel.soundEffects || [])
        }
      });

      console.log(chalk.green(`    ✓ Panel: ${createdPanel.panelId} (Page ${currentPage}, Panel ${currentPanelNum})`));

      // Migrate dialogue
      if (panel.dialogue && Array.isArray(panel.dialogue) && panel.dialogue.length > 0) {
        for (let d = 0; d < panel.dialogue.length; d++) {
          const dialogueItem = panel.dialogue[d];
          
          await prisma.dialogue.create({
            data: {
              panelId: createdPanel.id,
              speakerId: dialogueItem.speaker || null,
              text: dialogueItem.text || '',
              bubbleType: 'speech',
              position: dialogueItem.position ? JSON.stringify(dialogueItem.position) : null,
              orderIndex: d
            }
          });
        }
        console.log(chalk.gray(`      → ${panel.dialogue.length} dialogue items`));
      }
    }

    console.log(chalk.green(`\n✓ Successfully migrated project: ${project.title}`));
    console.log(chalk.gray(`  - ${comicData.characters?.length || 0} characters`));
    console.log(chalk.gray(`  - ${comicData.panels.length} panels`));
    
    return project;
  } catch (error) {
    console.error(chalk.red('Failed to migrate comic.yaml:'), error.message);
    throw error;
  }
}

/**
 * Migrate agent-memory.json to database
 */
async function migrateAgentMemory() {
  try {
    const memoryPath = path.join(__dirname, '../config/agent-memory.json');
    
    if (!fs.existsSync(memoryPath)) {
      console.log(chalk.yellow('⚠️  agent-memory.json not found, skipping...'));
      return;
    }

    const memoryFile = fs.readFileSync(memoryPath, 'utf8');
    const memoryData = JSON.parse(memoryFile);

    console.log(chalk.cyan('\n🧠 Migrating Agent Memory...'));

    let totalRecords = 0;

    // Migrate successful operations
    if (memoryData.toolPreferences) {
      for (const [toolName, prefs] of Object.entries(memoryData.toolPreferences)) {
        if (prefs.successfulParams && Array.isArray(prefs.successfulParams)) {
          for (const success of prefs.successfulParams) {
            await prisma.agentMemory.create({
              data: {
                toolName,
                operationType: 'success',
                params: JSON.stringify(success.params || {}),
                result: null,
                executionTimeMs: null
              }
            });
            totalRecords++;
          }
        }
      }
    }

    // Migrate failures
    if (memoryData.failurePatterns) {
      for (const [toolName, failures] of Object.entries(memoryData.failurePatterns)) {
        if (failures.commonErrors) {
          for (const [errorKey, errorData] of Object.entries(failures.commonErrors)) {
            await prisma.agentMemory.create({
              data: {
                toolName,
                operationType: 'failure',
                params: JSON.stringify({}),
                result: null,
                errorMessage: errorData.fullError || errorKey
              }
            });
            totalRecords++;
          }
        }
      }
    }

    console.log(chalk.green(`✓ Migrated ${totalRecords} agent memory records`));
  } catch (error) {
    console.error(chalk.red('Failed to migrate agent memory:'), error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  YAML to Database Migration'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  try {
    // Step 1: Create default user
    const user = await createDefaultUser();

    // Step 2: Migrate layouts
    await migrateLayouts();

    // Step 3: Migrate comic.yaml
    const comicPath = path.join(__dirname, '../config/comic.yaml');
    await migrateComicYaml(user.id, comicPath, 'City of Neon Dreams');

    // Step 4: Migrate comic-2.yaml if exists
    const comic2Path = path.join(__dirname, '../config/comic-2.yaml');
    if (fs.existsSync(comic2Path)) {
      await migrateComicYaml(user.id, comic2Path, 'Comic Project 2');
    }

    // Step 5: Migrate agent memory
    await migrateAgentMemory();

    console.log(chalk.green.bold('\n✅ Migration completed successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('  1. Verify data in database'));
    console.log(chalk.gray('  2. Update tools to use database'));
    console.log(chalk.gray('  3. Test all workflows'));
    console.log(chalk.gray('  4. Backup YAML files'));
    console.log(chalk.gray('  5. Archive old YAML files\n'));

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Migration failed!'));
    console.error(chalk.red(error.message));
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main();
