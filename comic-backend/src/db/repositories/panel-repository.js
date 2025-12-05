/**
 * Panel Repository
 * Data access layer for panels
 */

import prisma from '../client.js';

export class PanelRepository {
  /**
   * Create panels in bulk
   */
  async createMany(projectId, panelsData) {
    const panels = panelsData.map((panel, index) => ({
      projectId,
      panelId: panel.panelId || `panel${index + 1}`,
      pageNumber: panel.pageNumber,
      panelNumber: panel.panelNumber,
      description: panel.description,
      prompt: panel.prompt,
      cameraAngle: panel.cameraAngle,
      width: panel.width || 832,
      height: panel.height || 1248,
      contextImages: panel.contextImages || [],
      title: panel.title || null,
      narration: panel.narration || null,
      soundEffects: panel.soundEffects || []
    }));

    return await prisma.panel.createMany({
      data: panels
    });
  }

  /**
   * Get panel by ID
   */
  async getById(panelId) {
    return await prisma.panel.findUnique({
      where: { id: panelId },
      include: {
        dialogue: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
  }

  /**
   * Get panel by project and panel ID
   */
  async getByPanelId(projectId, panelId) {
    return await prisma.panel.findUnique({
      where: {
        projectId_panelId: {
          projectId,
          panelId
        }
      },
      include: {
        dialogue: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
  }

  /**
   * Get all panels for a project
   */
  async getByProjectId(projectId) {
    return await prisma.panel.findMany({
      where: { projectId },
      orderBy: [
        { pageNumber: 'asc' },
        { panelNumber: 'asc' }
      ],
      include: {
        dialogue: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
  }

  /**
   * Get panels by page number
   */
  async getByPage(projectId, pageNumber) {
    return await prisma.panel.findMany({
      where: {
        projectId,
        pageNumber
      },
      orderBy: { panelNumber: 'asc' },
      include: {
        dialogue: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
  }

  /**
   * Update panel
   */
  async update(panelId, data) {
    return await prisma.panel.update({
      where: { id: panelId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update panel by panelId
   */
  async updateByPanelId(projectId, panelId, data) {
    return await prisma.panel.update({
      where: {
        projectId_panelId: {
          projectId,
          panelId
        }
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update panel image URLs
   */
  async updateImageUrls(panelId, imageUrl, textImageUrl = null) {
    return await this.update(panelId, {
      imageUrl,
      ...(textImageUrl && { textImageUrl })
    });
  }

  /**
   * Add dialogue to panel
   */
  async addDialogue(panelId, dialogueData) {
    return await prisma.dialogue.createMany({
      data: dialogueData.map((d, index) => ({
        panelId,
        speakerId: d.speaker || d.speakerId,
        text: d.text,
        bubbleType: d.bubbleType || 'speech',
        position: d.position || null,
        orderIndex: d.orderIndex !== undefined ? d.orderIndex : index
      }))
    });
  }

  /**
   * Update dialogue position
   */
  async updateDialoguePosition(dialogueId, position) {
    return await prisma.dialogue.update({
      where: { id: dialogueId },
      data: { position }
    });
  }

  /**
   * Delete panel
   */
  async delete(panelId) {
    return await prisma.panel.delete({
      where: { id: panelId }
    });
  }
}

export default new PanelRepository();
