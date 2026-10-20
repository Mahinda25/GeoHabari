import * as contentful from "contentful";

let contentfulClient;

try {
  const spaceId = import.meta.env.CONTENTFUL_SPACE_ID;
  const accessToken = import.meta.env.DEV
    ? import.meta.env.CONTENTFUL_PREVIEW_TOKEN
    : import.meta.env.CONTENTFUL_DELIVERY_TOKEN;

  if (spaceId && accessToken) {
    contentfulClient = contentful.createClient({
      space: spaceId,
      accessToken: accessToken,
      host: import.meta.env.DEV ? "preview.contentful.com" : "cdn.contentful.com",
    });
  }
} catch (e) {
  console.warn("[Contentful] Could not initialize client — using dummy data fallback.");
}

// Dummy proxy that returns empty entries when Contentful is unavailable
if (!contentfulClient) {
  contentfulClient = {
    async getEntries() {
      return { items: [] };
    },
    async getEntry() {
      return { fields: {} };
    }
  };
}

export { contentfulClient };
