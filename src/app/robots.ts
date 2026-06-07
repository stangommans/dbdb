import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://divebardb.com';
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/explore', '/about', '/bar/*'],
      disallow: ['/admin', '/profile', '/stash', '/api/*'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
