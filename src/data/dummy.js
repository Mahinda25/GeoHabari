/**
 * Dummy data for development without API keys.
 * Provides realistic placeholder data so the frontend renders beautifully.
 */

export const dummySegments = [
  {
    name: "Young Professionals",
    slug: "young-professionals",
    description: "Early-career voices navigating the geospatial industry — career paths, mentorship, and breaking in.",
    icon: "users",
    color: "#8DC63F",
    matchTags: ["young professionals segment", "young professionals"],
  },
  {
    name: "The Space Ecosystem Playbook",
    slug: "space-ecosystem-playbook",
    description: "Africa's growing role in the global space economy — satellites, earth observation, and policy.",
    icon: "satellite",
    color: "#6C2BD9",
    matchTags: ["space ecosystem playbook", "space ecosystem"],
  },
  {
    name: "Tech Stack Series",
    slug: "tech-stack-series",
    description: "Deep dives into the tools and platforms powering African geo-innovation — GIS, remote sensing, and more.",
    icon: "layers",
    color: "#3B82F6",
    matchTags: ["tech stacks", "tech stack", "tech stack series"],
  },
];

export const dummyEpisodes = [
  {
    id: 10001,
    title: "The Space Economy Playbook: Africa's Satellite Revolution",
    description: "We dive deep into how African nations are launching satellite programs, building ground stations, and creating a space economy that could transform agriculture, urban planning, and disaster response across the continent.",
    summary: "Exploring Africa's growing satellite and space technology sector.",
    audio_url: "",
    artwork_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=400&fit=crop",
    published_at: "2025-12-15T08:00:00Z",
    duration: 2640,
    season_number: 3,
    episode_number: 1,
    tags: "tech,space,earth",
    segment: "space-ecosystem-playbook"
  },
  {
    id: 10002,
    title: "Mapping Nairobi's Hidden Infrastructure with Open Data",
    description: "From informal settlements to water networks, discover how open-source GIS tools are revealing the invisible infrastructure that keeps Nairobi running.",
    summary: "Open data mapping in Nairobi's urban landscape.",
    audio_url: "",
    artwork_url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop",
    published_at: "2025-12-01T08:00:00Z",
    duration: 1980,
    season_number: 3,
    episode_number: 2,
    tags: "tech,action,career",
    segment: "tech-stack-series"
  },
  {
    id: 10003,
    title: "From Campus to Career: GIS Scholarships That Changed Lives",
    description: "Three alumni share how geospatial scholarships opened doors they never knew existed — from remote sensing in Germany to urban analytics in Cape Town.",
    summary: "Stories of scholarship recipients in the geospatial field.",
    audio_url: "",
    artwork_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=400&fit=crop",
    published_at: "2025-11-17T08:00:00Z",
    duration: 2220,
    season_number: 2,
    episode_number: 12,
    tags: "study+abroad,career,academia",
    segment: "young-professionals"
  },
  {
    id: 10004,
    title: "AI Meets Earth Observation: Predicting Crop Yields in East Africa",
    description: "Machine learning models trained on satellite imagery are helping smallholder farmers predict yields, detect disease, and optimize irrigation — we explore the tech and the people behind it.",
    summary: "AI and satellite imagery for agricultural predictions.",
    audio_url: "",
    artwork_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=400&fit=crop",
    published_at: "2025-11-03T08:00:00Z",
    duration: 2460,
    season_number: 2,
    episode_number: 11,
    tags: "tech,earth,action",
    segment: "tech-stack-series"
  },
  {
    id: 10005,
    title: "Banter Episode: Tech Fails, Map Fails, and Everything In Between",
    description: "The hosts get together for a lighthearted episode about their biggest tech blunders, funniest map mishaps, and the lessons learned along the way.",
    summary: "A fun episode about tech and mapping fails.",
    audio_url: "",
    artwork_url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop",
    published_at: "2025-10-20T08:00:00Z",
    duration: 1800,
    season_number: 2,
    episode_number: 10,
    tags: "banter",
    segment: "young-professionals"
  }
];

export const dummyThemes = [
  {
    title: "TECH",
    description: "Geo-enabling technologies shaping how we interact with our world. From drones to digital twins.",
    background: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=400&h=400&fit=crop"
  },
  {
    title: "STUDY ABROAD",
    description: "Scholarship tips, application guides, and stories from Africans studying geospatial science worldwide.",
    background: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=400&fit=crop"
  },
  {
    title: "BANTER",
    description: "Light-hearted conversations about tech culture, memes, and the everyday life of geo-professionals.",
    background: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop"
  },
  {
    title: "CAREER",
    description: "Navigate diverse career paths in the geospatial industry — pivotal moments, key learnings, and challenges.",
    background: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
  },
  {
    title: "EARTH",
    description: "Earth observation use cases across Africa — from flood mapping to deforestation monitoring.",
    background: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop"
  },
  {
    title: "ACADEMIA",
    description: "Research breakthroughs, thesis tips, and conversations with professors and PhD students.",
    background: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop"
  },
  {
    title: "ACTION",
    description: "GIS solutions solving real problems — disaster response, urban planning, health mapping, and more.",
    background: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&h=400&fit=crop"
  }
];

export const dummyQuoteCards = {
  items: [
    { fields: { quoteCard: { fields: { file: { url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop" }, title: "Quote 1" } } } },
    { fields: { quoteCard: { fields: { file: { url: "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=400&h=400&fit=crop" }, title: "Quote 2" } } } },
    { fields: { quoteCard: { fields: { file: { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop" }, title: "Quote 3" } } } },
  ]
};

export const dummyNextEp = {
  fields: {
    episodeTitle: "Drones Over the Savanna: Mapping Wildlife Corridors",
    releaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    host: {
      fields: {
        file: { url: "/images/team/yariwo.jpg" },
        title: "Yariwo Kitiyo"
      }
    },
    guests: [
      {
        fields: {
          file: { url: "/images/team/jmochieng.jpeg" },
          title: "JohnMark Ochieng"
        }
      }
    ]
  }
};
