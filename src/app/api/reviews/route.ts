import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrCreateReviewerToken, setReviewerCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barId, diveScore, pricePerMl, relativePrice, murkiness, comment, photoUrl } = body;

    if (!barId || !diveScore) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const scoreNum = parseInt(diveScore);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      return NextResponse.json({ error: 'diveScore must be an integer between 1 and 5' }, { status: 400 });
    }

    // Get or create secure reviewer token
    const { uuid: reviewerUuid, rawToken, isNew } = await getOrCreateReviewerToken();

    // Check if review already exists for this bar by this anonymous user
    const existingReview = await db.review.findFirst({
      where: {
        barId,
        reviewerToken: reviewerUuid,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this dive bar! You can edit your existing review instead.' },
        { status: 403 }
      );
    }

    // Create review in database, saving the inner verified UUID as reviewerToken
    const newReview = await db.review.create({
      data: {
        barId,
        diveScore: scoreNum,
        pricePerMl: pricePerMl ? parseFloat(pricePerMl) : null,
        relativePrice: relativePrice ? parseInt(relativePrice) : null,
        murkiness: murkiness || null,
        comment: comment || null,
        photoUrl: photoUrl || null,
        reviewerToken: reviewerUuid,
      },
    });

    // Create response
    const response = NextResponse.json(newReview, { status: 201 });

    // Set signed cookie back to client if it's new (persistent session initialization)
    if (isNew) {
      await setReviewerCookie(rawToken);
    }

    return response;
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
