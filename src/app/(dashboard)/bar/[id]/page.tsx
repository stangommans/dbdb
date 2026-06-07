import { db } from '@/lib/db';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  const bar = await db.bar.findUnique({
    where: { id },
    include: {
      reviews: true,
    },
  });

  if (!bar) {
    return {
      title: 'Bar Not Found | Divebar Database',
      description: 'The requested bar could not be found in the Divebar Database.',
    };
  }

  // Calculate rating stats
  const reviewCount = bar.reviews.length;
  const avgScore = reviewCount > 0
    ? bar.reviews.reduce((sum, r) => sum + r.diveScore, 0) / reviewCount
    : 0;

  const scoreText = reviewCount > 0 ? `★ ${avgScore.toFixed(1)} (${reviewCount} reviews)` : 'No reviews yet';
  const title = `${bar.name} | Divebar Database`;
  const description = `Explore dive rating metrics and user reviews for ${bar.name} at ${bar.address}. Rated ${scoreText}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/bar/${id}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function BarPage({ params }: Props) {
  const { id } = await params;
  
  const bar = await db.bar.findUnique({
    where: { id },
    include: {
      reviews: true,
    },
  });

  if (!bar) return null;

  const reviewCount = bar.reviews.length;
  const avgScore = reviewCount > 0
    ? bar.reviews.reduce((sum, r) => sum + r.diveScore, 0) / reviewCount
    : 0;

  // Generate dynamic JSON-LD structured schema for search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bar",
    "@id": `https://divebardb.com/bar/${bar.id}`,
    "name": bar.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": bar.address,
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": bar.latitude,
      "longitude": bar.longitude,
    },
    ...(reviewCount > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": avgScore.toFixed(1),
        "reviewCount": reviewCount.toString(),
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
