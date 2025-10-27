// src/services/leonardoWorkflow.js
/**
 * Simple Leonardo AI Workflow
 * Generate comic panels using Leonardo AI only
 */

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
const LEONARDO_API_URL = "https://cloud.leonardo.ai/api/rest/v1/generations";

/**
 * Generate comic panels using Leonardo AI
 */
export async function generateComicPanels(panels) {
  try {
    console.log("🎨 Generating comic panels with Leonardo AI...");
    
    const results = [];
    
    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      console.log(`📸 Generating panel ${i + 1}/${panels.length}: ${panel.id}`);
      
      const result = await generateSinglePanel(panel);
      results.push({
        ...panel,
        ...result
      });
      
      // Small delay to avoid rate limits
      if (i < panels.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log("✅ All panels generated successfully!");
    return { success: true, panels: results };
    
  } catch (error) {
    console.error("❌ Leonardo AI generation failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a single panel using Leonardo AI
 */
async function generateSinglePanel(panel) {
  try {
    const response = await axios.post(
      LEONARDO_API_URL,
      {
        prompt: panel.prompt,
        negative_prompt: "text, words, letters, speech bubbles, dialogue",
        model_id: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3", // Leonardo Diffusion XL
        width: panel.width,
        height: panel.height,
        num_images: 1,
        guidance_scale: 7,
        steps: 20
      },
      {
        headers: {
          "Authorization": `Bearer ${LEONARDO_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    const generationId = response.data.sdGenerationJob.generationId;
    console.log(`   → Generation ID: ${generationId}`);
    
    // Wait for generation to complete
    const imageUrl = await waitForGeneration(generationId);
    
    return {
      generationId,
      imageUrl,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ Failed to generate panel ${panel.id}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Wait for Leonardo generation to complete
 */
async function waitForGeneration(generationId, maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(
        `${LEONARDO_API_URL}/${generationId}`,
        {
          headers: {
            "Authorization": `Bearer ${LEONARDO_API_KEY}`
          }
        }
      );
      
      const status = response.data.generations_by_pk.status;
      console.log(`   → Attempt ${attempt}: Status = ${status}`);
      
      if (status === "COMPLETE") {
        const imageUrl = response.data.generations_by_pk.generated_images[0].url;
        console.log(`   ✅ Panel generated: ${imageUrl}`);
        return imageUrl;
      } else if (status === "FAILED") {
        throw new Error("Generation failed");
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`   → Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error("Generation timeout");
}




