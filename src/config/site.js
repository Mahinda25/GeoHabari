// src/config/site.js
export default {
  name: 'Geohabari',
  title: 'Geohabari - Amplifying African Tech Stories',
  description: 'Amplifying African tech stories & building tech brilliance. Discover conversations about tech, geospatial technology, earth observation, career paths, and study abroad opportunities across Africa.',
  url: 'https://www.geohabari.com',
  author: 'Geohabari Team',
  
  // SEO defaults
  keywords: [
    'African tech',
    'geospatial technology', 
    'GIS',
    'earth observation',
    'tech careers',
    'study abroad',
    'podcasts',
    'technology Africa',
    'geo-enabling',
    'African innovation'
  ],
  
  // Social media handles
  social: [
    {
      name: 'Twitter',
      handle: '@geohabari',
      url: 'https://twitter.com/geohabari'
    },
    {
      name: 'LinkedIn',
      handle: 'geohabari',
      url: 'https://linkedin.com/company/geohabari'
    },
    {
      name: 'Instagram',
      handle: '@geohabari',
      url: 'https://instagram.com/geohabari'
    },
    {
      name: 'Spotify',
      handle: 'Geohabari',
      url: 'https://open.spotify.com/show/your-podcast-id'
    },
    {
      name: 'Apple Podcasts',
      handle: 'Geohabari',
      url: 'https://podcasts.apple.com/ke/podcast/geohabari/id1747885525'
    },
    {
      name: 'YouTube',
      handle: '@GeohabariPod',
      url: 'https://www.youtube.com/@GeohabariPod'
    }
  ],
  
  // Podcast categories
  categories: [
    {
      name: 'TECH',
      description: 'Discover African organizations leading in geo-enabling and other cutting-edge technologies. We dive into the systems\' components, from programming languages to seamless integrations, showcasing impactful use cases across the continent.',
      slug: 'tech'
    },
    {
      name: 'STUDY ABROAD',
      description: 'Scholarship recipients share their application tips and tricks, covering everything from requirements to living abroad. The ultimate starter pack for geospatial students looking to study overseas.',
      slug: 'study-abroad'
    },
    {
      name: 'BANTER',
      description: 'Blend technical expertise with humor to humanize experiences in the tech world. Ideal for those looking for a light-hearted, tech-centric laugh.',
      slug: 'banter'
    },
    {
      name: 'CAREER',
      description: 'Navigate diverse career paths in the geospatial industry. Discussing pivotal moments, key learnings, and challenges, these episodes inspire you to explore new career horizons.',
      slug: 'career'
    },
    {
      name: 'EARTH',
      description: 'Dive into Earth Observation (EO) use cases across various sectors. From technical tools and datasets to real-world applications and impacts, each episode offers a comprehensive look at EO\'s potential.',
      slug: 'earth'
    },
    {
      name: 'ACADEMIA',
      description: 'Discover African organizations leading in geo-enabling and other cutting-edge technologies. We dive into the systems\' components, from programming languages to seamless integrations, showcasing impactful use cases across the continent.',
      slug: 'academia'
    },
    {
      name: 'ACTION',
      description: 'Explore how tech is used across Africa to drive change. Highlighting limitless possibilities, we showcase how GIS is leveraged for impactful solutions in different industries.',
      slug: 'action'
    }
  ],
  
  // Contact information
  contact: {
    email: 'hello@geohabari.com',
    phone: null, // Add if you have a business phone
    address: {
      city: 'Nairobi',
      country: 'Kenya',
      region: 'East Africa'
    }
  },
  
  // Analytics IDs (replace with your actual IDs)
  analytics: {
    googleAnalytics: 'GA_TRACKING_ID', // Replace with your GA4 ID
    googleTagManager: 'GTM_CONTAINER_ID', // Replace with your GTM ID if using
    facebookPixel: null, // Add if using Facebook Pixel
    linkedInInsight: null // Add if using LinkedIn Insight
  },
  
  // Newsletter/Email marketing
  newsletter: {
    provider: 'mailchimp', // or 'convertkit', 'substack', etc.
    signupUrl: 'https://your-newsletter-signup-url.com'
  },
  
  // Features flags
  features: {
    newsletter: true,
    search: true,
    comments: false,
    darkMode: true,
    i18n: false // Set to true if you plan multi-language support
  }
};