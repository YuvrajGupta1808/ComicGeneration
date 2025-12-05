/**
 * Project Repository
 * Data access layer for projects
 */

import prisma from '../client.js';

export class ProjectRepository {
  /**
   * Create a new project
   */
  async create(userId, data) {
    return await prisma.project.create({
      data: {
        userId,
        title: data.title,
        genre: data.genre,
        tone: data.tone,
        storyContext: data.storyContext,
        pageCount: data.pageCount || 3,
        status: 'draft'
      }
    });
  }

  /**
   * Get project by ID with all related data
   */
  async getById(projectId, includeRelations = true) {
    const include = includeRelations ? {
      characters: {
        orderBy: { characterId: 'asc' }
      },
      panels: {
        orderBy: [
          { pageNumber: 'asc' },
          { panelNumber: 'asc' }
        ],
        include: {
          dialogue: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      }
    } : undefined;

    return await prisma.project.findUnique({
      where: { id: projectId },
      include
    });
  }

  /**
   * Get all projects for a user
   */
  async getByUserId(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;

    return await prisma.project.findMany({
      where: {
        userId,
        ...(status && { status })
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        characters: true,
        panels: true
      }
    });
  }

  /**
   * Update project
   */
  async update(projectId, data) {
    return await prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update project status
   */
  async updateStatus(projectId, status) {
    return await this.update(projectId, { status });
  }

  /**
   * Delete project (cascades to all related data)
   */
  async delete(projectId) {
    return await prisma.project.delete({
      where: { id: projectId }
    });
  }

  /**
   * Get project statistics
   */
  async getStats(projectId) {
    const [characterCount, panelCount, dialogueCount] = await Promise.all([
      prisma.character.count({ where: { projectId } }),
      prisma.panel.count({ where: { projectId } }),
      prisma.dialogue.count({
        where: {
          panel: { projectId }
        }
      })
    ]);

    return {
      characters: characterCount,
      panels: panelCount,
      dialogue: dialogueCount
    };
  }
}

export default new ProjectRepository();
