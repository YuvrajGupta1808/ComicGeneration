#!/usr/bin/env node

import axios from 'axios';
import 'dotenv/config';

async function testServerCompose() {
  console.log('🧪 Testing server compose pages...');
  
  try {
    // Test the server endpoint
    const response = await axios.post('http://localhost:8000/chat', {
      message: 'compose pages from comic.yaml'
    });
    
    console.log('✅ Server response:', response.data);
    
    if (response.data.pageUrls) {
      console.log('📖 Page URLs received:', response.data.pageUrls);
    } else {
      console.log('❌ No page URLs in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testServerCompose();