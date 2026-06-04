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

export default function BarPage() {
  return null;
}
