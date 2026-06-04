import { db } from '@/lib/db';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string; reviewId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, reviewId } = await params;

  // Fetch the review and join with the bar it belongs to
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      bar: true,
    },
  });

  if (!review || review.barId !== id) {
    return {
      title: 'Review Not Found | Divebar Database',
      description: 'The requested review could not be found.',
    };
  }

  const commentSnippet = review.comment 
    ? `"${review.comment.length > 60 ? review.comment.substring(0, 60) + '...' : review.comment}"`
    : 'No comment details provided.';

  const title = `★ ${review.diveScore.toFixed(1)} Review for ${review.bar.name} | Divebar Database`;
  const description = `Read user review of ${review.bar.name}: ${commentSnippet} Rated ★ ${review.diveScore.toFixed(1)}.`;

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

export default function ReviewPage() {
  return null;
}
