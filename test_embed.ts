import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

async function testEmbedding() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent({ content: 'test', outputDimensionality: 768 } as any);
    console.log(`gemini-embedding-001 returned ${result.embedding.values.length} dimensions`);
  } catch (e: any) {
    console.log('FAILED TO EMBED', e.message);
  }
}

testEmbedding();
