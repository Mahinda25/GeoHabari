/**
 * YouTube Data API v3 utility
 * Fetches latest and most-viewed videos from the Geohabari channel.
 * Used at build time by Astro pages.
 */

const API_KEY = import.meta.env.YOUTUBE_API_KEY;
const CHANNEL_ID = import.meta.env.YOUTUBE_CHANNEL_ID;
const CHANNEL_URL = "https://www.youtube.com/@GeohabariPod";

/**
 * Fetch latest videos from the channel (ordered by date).
 * @param {number} maxResults - Number of videos to fetch (max 50)
 * @returns {Promise<Array>} Array of video objects
 */
export async function getLatestVideos(maxResults = 5) {
  if (!API_KEY || !CHANNEL_ID) {
    console.warn("[YouTube] Missing YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID — returning fallback data.");
    return getFallbackVideos();
  }

  try {
    // Step 1: Search for latest videos from the channel
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("key", API_KEY);
    searchUrl.searchParams.set("channelId", CHANNEL_ID);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("order", "date");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", String(maxResults));

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      throw new Error(`YouTube search API error: ${searchRes.status} ${searchRes.statusText}`);
    }
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      console.warn("[YouTube] No videos found for channel — returning fallback data.");
      return getFallbackVideos();
    }

    // Step 2: Get video details (view count, duration) via videos endpoint
    const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("key", API_KEY);
    videosUrl.searchParams.set("id", videoIds);
    videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");

    const videosRes = await fetch(videosUrl.toString());
    if (!videosRes.ok) {
      throw new Error(`YouTube videos API error: ${videosRes.status} ${videosRes.statusText}`);
    }
    const videosData = await videosRes.json();

    return videosData.items.map(normalizeVideo);
  } catch (err) {
    console.error("[YouTube] API fetch failed:", err.message);
    return getFallbackVideos();
  }
}

/**
 * Fetch most-viewed videos from the channel.
 * @param {number} maxResults - Number of videos to fetch
 * @returns {Promise<Array>} Array of video objects sorted by view count
 */
export async function getMostViewedVideos(maxResults = 5) {
  if (!API_KEY || !CHANNEL_ID) {
    console.warn("[YouTube] Missing YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID — returning fallback data.");
    return getFallbackVideos();
  }

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("key", API_KEY);
    searchUrl.searchParams.set("channelId", CHANNEL_ID);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("order", "viewCount");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", String(maxResults));

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      throw new Error(`YouTube search API error: ${searchRes.status} ${searchRes.statusText}`);
    }
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return getFallbackVideos();
    }

    const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("key", API_KEY);
    videosUrl.searchParams.set("id", videoIds);
    videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");

    const videosRes = await fetch(videosUrl.toString());
    if (!videosRes.ok) {
      throw new Error(`YouTube videos API error: ${videosRes.status} ${videosRes.statusText}`);
    }
    const videosData = await videosRes.json();

    return videosData.items.map(normalizeVideo);
  } catch (err) {
    console.error("[YouTube] API fetch failed:", err.message);
    return getFallbackVideos();
  }
}

/**
 * Normalize a YouTube API video item into a consistent shape.
 */
function normalizeVideo(item) {
  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const thumbs = snippet.thumbnails || {};

  return {
    id: item.id,
    title: snippet.title || "Untitled",
    description: snippet.description || "",
    thumbnail: thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || "",
    thumbnailMedium: thumbs.medium?.url || thumbs.default?.url || "",
    publishedAt: snippet.publishedAt || "",
    viewCount: Number(stats.viewCount || 0),
    likeCount: Number(stats.likeCount || 0),
    duration: parseDuration(item.contentDetails?.duration || ""),
    url: `https://www.youtube.com/watch?v=${item.id}`,
    channelUrl: CHANNEL_URL,
  };
}

/**
 * Parse ISO 8601 duration (PT1H2M3S) to human-readable string.
 */
function parseDuration(iso) {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Format view count to human-readable (e.g. 1.2K, 3.4M).
 */
export function formatViewCount(count) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/**
 * Fallback hardcoded videos used when API key is missing or API fails.
 */
function getFallbackVideos() {
  return [
    {
      id: "fallback-1",
      title: "Geohabari: The Journey So Far",
      description: "Our story, our mission, and the incredible people we've met along the way.",
      thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=450&fit=crop",
      thumbnailMedium: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=340&fit=crop",
      publishedAt: "",
      viewCount: 0,
      likeCount: 0,
      duration: "",
      url: CHANNEL_URL,
      channelUrl: CHANNEL_URL,
    },
    {
      id: "fallback-2",
      title: "Earth Observation & Africa's Future",
      description: "How satellite data is transforming decision-making across the continent.",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=340&fit=crop",
      thumbnailMedium: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=340&fit=crop",
      publishedAt: "",
      viewCount: 0,
      likeCount: 0,
      duration: "",
      url: CHANNEL_URL,
      channelUrl: CHANNEL_URL,
    },
    {
      id: "fallback-3",
      title: "Breaking into Geo-Tech Careers",
      description: "Tips and stories from professionals who made it in the geospatial industry.",
      thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=340&fit=crop",
      thumbnailMedium: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=340&fit=crop",
      publishedAt: "",
      viewCount: 0,
      likeCount: 0,
      duration: "",
      url: CHANNEL_URL,
      channelUrl: CHANNEL_URL,
    },
    {
      id: "fallback-4",
      title: "Innovation Hubs Across Africa",
      description: "Exploring the tech ecosystems driving change across the continent.",
      thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=340&fit=crop",
      thumbnailMedium: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=340&fit=crop",
      publishedAt: "",
      viewCount: 0,
      likeCount: 0,
      duration: "",
      url: CHANNEL_URL,
      channelUrl: CHANNEL_URL,
    },
    {
      id: "fallback-5",
      title: "Mapping Communities for Impact",
      description: "How community mapping projects are empowering local voices.",
      thumbnail: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&h=340&fit=crop",
      thumbnailMedium: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&h=340&fit=crop",
      publishedAt: "",
      viewCount: 0,
      likeCount: 0,
      duration: "",
      url: CHANNEL_URL,
      channelUrl: CHANNEL_URL,
    },
  ];
}
