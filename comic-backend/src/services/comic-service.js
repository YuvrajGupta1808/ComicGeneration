/**
 * Comic Service
 * Business logic layer for comic operations
 * Replaces YAML file operations with database operations
 */

import characterRepo from '../db/repositories/character-repository.js';
import panelRepo from '../db/repositories/panel-repository.js';
import projectRepo from '../db/repositories/project-repository.js';

export class ComicService {
  /**
   * Create a new comic project
   */
  async createProject(userId, data) {
    return await projectRepo.create(userId, data);
  }

  /**
   * Get complete comic data (replaces loading comic.yaml)
   */
  async getComicData(projectId) {
    const project = await projectRepo.getById(projectId, true);
    
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Format to match YAML structure for backward compatibility
    return {
      project: {
        id: project.id,
        title: project.title,
        genre: project.genre,
        tone: project.tone,
        storyContext: project.storyContext,
        pageCount: project.pageCount,
        status: project.status
      },
      characters: project.characters.map(char => ({
        id: char.characterId,
        name: char.name,
        description: char.description,
        prompt: char.prompt,
        width: char.width,
        height: char.height,
        contextImages: typeof char.contextImages === 'string' ? JSON.parse(char.contextImages) : char.contextImages,
        imageUrl: char.imageUrl,
        leonardoId: char.leonardoId
      })),
      panels: project.panels.map(panel => ({
        id: panel.panelId,
        pageNumber: panel.pageNumber,
        panelNumber: panel.panelNumber,
        description: panel.description,
        prompt: panel.prompt,
        cameraAngle: panel.cameraAngle,
        width: panel.width,
        height: panel.height,
        contextImages: typeof panel.contextImages === 'string' ? JSON.parse(panel.contextImages) : panel.contextImages,
        imageUrl: panel.imageUrl,
        textImageUrl: panel.textImageUrl,
        leonardoId: panel.leonardoId,
        title: panel.title,
        narration: panel.narration,
        soundEffects: typeof panel.soundEffects === 'string' ? JSON.parse(panel.soundEffects) : panel.soundEffects,
        dialogue: panel.dialogue.map(d => ({
          speaker: d.speakerId,
          text: d.text,
          bubbleType: d.bubbleType,
          position: typeof d.position === 'string' ? JSON.parse(d.position) : d.position
        }))
      }))
    };
  }

  /**
   * Save panels (replaces saving to comic.yaml)
   */
  async savePanels(projectId, panelsData) {
    // Calculate page and panel numbers
    const project = await projectRepo.getById(projectId, false);
    const panelsPerPage = this.getPanelsPerPage(project.pageCount);
    
    const formattedPanels = [];
    let currentPanelCount = 0;
    
    for (let i = 0; i < panelsData.length; i++) {
      const panel = panelsData[i];
      
      // Determine page and panel number
      let pageNumber = 1;
      let panelNumber = 1;
      
      for (let p = 0; p < panelsPerPage.length; p++) {
        if (i < currentPanelCount + panelsPerPage[p]) {
          pageNumber = p + 1;
          panelNumber = i - currentPanelCount + 1;
          break;
        }
        currentPanelCount += panelsPerPage[p];
      }
      
      formattedPanels.push({
        ...panel,
        pageNumber,
        panelNumber,
        // Convert arrays to JSON strings for SQLite
        contextImages: Array.isArray(panel.contextImages) ? JSON.stringify(panel.contextImages) : (panel.contextImages || '[]'),
        soundEffects: Array.isArray(panel.soundEffects) ? JSON.stringify(panel.soundEffects) : (panel.soundEffects || '[]')
      });
    }
    
    return await panelRepo.createMany(projectId, formattedPanels);
  }

  /**
   * Save characters (replaces saving to characters.yaml)
   */
  async saveCharacters(projectId, charactersData) {
    // Convert arrays to JSON strings for SQLite
    const formattedCharacters = charactersData.map(char => ({
      ...char,
      contextImages: Array.isArray(char.contextImages) ? JSON.stringify(char.contextImages) : (char.contextImages || '[]')
    }));
    return await characterRepo.createMany(projectId, formattedCharacters);
  }

  /**
   * Update panel (replaces editing comic.yaml)
   */
  async updatePanel(projectId, panelId, updates) {
    // Convert arrays to JSON strings for SQLite
    const formattedUpdates = { ...updates };
    if (Array.isArray(formattedUpdates.soundEffects)) {
      formattedUpdates.soundEffects = JSON.stringify(formattedUpdates.soundEffects);
    }
    if (Array.isArray(formattedUpdates.contextImages)) {
      formattedUpdates.contextImages = JSON.stringify(formattedUpdates.contextImages);
    }
    return await panelRepo.updateByPanelId(projectId, panelId, formattedUpdates);
  }

  /**
   * Update character (replaces editing characters.yaml)
   */
  async updateCharacter(projectId, characterId, updates) {
    return await characterRepo.updateByCharacterId(projectId, characterId, updates);
  }

  /**
   * Add dialogue to panel
   */
  async addDialogue(projectId, panelId, dialogueData) {
    const panel = await panelRepo.getByPanelId(projectId, panelId);
    if (!panel) {
      throw new Error(`Panel ${panelId} not found`);
    }
    
    return await panelRepo.addDialogue(panel.id, dialogueData);
  }

  /**
   * Update panel image URLs after generation
   */
  async updatePanelImages(projectId, panelId, imageUrl, textImageUrl = null) {
    const panel = await panelRepo.getByPanelId(projectId, panelId);
    if (!panel) {
      throw new Error(`Panel ${panelId} not found`);
    }
    
    return await panelRepo.updateImageUrls(panel.id, imageUrl, textImageUrl);
  }

  /**
   * Update character image URL after generation
   */
  async updateCharacterImage(projectId, characterId, imageUrl, leonardoId = null) {
    const character = await characterRepo.getByCharacterId(projectId, characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }
    
    return await characterRepo.updateImageUrl(character.id, imageUrl, leonardoId);
  }

  /**
   * Get panels per page based on page count
   */
  getPanelsPerPage(pageCount) {
    const layouts = {
      3: [3, 3, 2],
      4: [3, 3, 3, 3],
      5: [3, 3, 3, 3, 2]
    };
    return layouts[pageCount] || layouts[3];
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId) {
    return await projectRepo.getStats(projectId);
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    return await projectRepo.delete(projectId);
  }
}

export default new ComicService();
