/**
 * Character Repository
 * Data access layer for characters
 */

import prisma from '../client.js';

export class CharacterRepository {
  /**
   * Create characters in bulk
   */
  async createMany(projectId, charactersData) {
    const characters = charactersData.map((char, index) => ({
      projectId,
      characterId: char.characterId || char.id || `char_${index + 1}`,
      name: char.name || null,
      description: char.description,
      prompt: char.prompt,
      width: char.width || 832,
      height: char.height || 1248,
      contextImages: char.contextImages || []
    }));

    return await prisma.character.createMany({
      data: characters
    });
  }

  /**
   * Get character by ID
   */
  async getById(characterId) {
    return await prisma.character.findUnique({
      where: { id: characterId }
    });
  }

  /**
   * Get character by project and character ID
   */
  async getByCharacterId(projectId, characterId) {
    return await prisma.character.findUnique({
      where: {
        projectId_characterId: {
          projectId,
          characterId
        }
      }
    });
  }

  /**
   * Get all characters for a project
   */
  async getByProjectId(projectId) {
    return await prisma.character.findMany({
      where: { projectId },
      orderBy: { characterId: 'asc' }
    });
  }

  /**
   * Update character
   */
  async update(characterId, data) {
    return await prisma.character.update({
      where: { id: characterId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update character by characterId
   */
  async updateByCharacterId(projectId, characterId, data) {
    return await prisma.character.update({
      where: {
        projectId_characterId: {
          projectId,
          characterId
        }
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update character image URL
   */
  async updateImageUrl(characterId, imageUrl, leonardoId = null) {
    return await this.update(characterId, {
      imageUrl,
      ...(leonardoId && { leonardoId })
    });
  }

  /**
   * Delete character
   */
  async delete(characterId) {
    return await prisma.character.delete({
      where: { id: characterId }
    });
  }
}

export default new CharacterRepository();
