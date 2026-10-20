// src/pages/api/episodes.js
import { getDefaultClient } from '../../utils/buzzsprout.js';

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '10';
    const page = url.searchParams.get('page') || '1';
    
    const client = getDefaultClient();
    const episodes = await client.getEpisodesPage(parseInt(page), parseInt(limit));
    
    return new Response(JSON.stringify(episodes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}