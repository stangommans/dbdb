import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://divebardb.com';

  // Core static routes
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Dynamically generated bar endpoints
  let dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const bars = await db.bar.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
    });

    dynamicPages = bars.map((bar) => ({
      url: `${baseUrl}/bar/${bar.id}`,
      lastModified: bar.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Failed to generate dynamic sitemap entries:', error);
  }

  return [...staticPages, ...dynamicPages];
}
