import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrCreateReviewerToken } from '@/lib/session';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve dynamic params safely in Next.js 15+ async router
    const { id } = await context.params;
    
    const body = await request.json();
    const { 
      diveScore, 
      pricePerMl, 
      comment, 
      photoUrl, 
      amenities,
      vessel,
      vesselSize,
      vesselSizeMl,
      purchasePrice,
      purchaseCurrency
    } = body;

    if (!diveScore) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const scoreNum = parseInt(diveScore);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      return NextResponse.json({ error: 'diveScore must be an integer between 1 and 5' }, { status: 400 });
    }

    // Get verified reviewer token UUID from cookie
    const { uuid: reviewerUuid } = await getOrCreateReviewerToken();

    // Find review
    const review = await db.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify ownership
    if (review.reviewerToken !== reviewerUuid) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this review.' }, { status: 403 });
    }

    // Update review
    const updatedReview = await db.review.update({
      where: { id },
      data: {
        diveScore: scoreNum,
        pricePerMl: pricePerMl ? parseFloat(pricePerMl) : null,
        comment: comment || null,
        photoUrl: photoUrl || null,
        amenities: amenities || null,
        vessel: vessel || null,
        vesselSize: vesselSize || null,
        vesselSizeMl: vesselSizeMl ? parseFloat(vesselSizeMl) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseCurrency: purchaseCurrency || null,
      },
    });

    // Recalculate parent bar's amenities tags union
    await syncBarAmenities(updatedReview.barId);

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get verified reviewer token UUID from cookie
    const { uuid: reviewerUuid } = await getOrCreateReviewerToken();

    // Validate administrative override credentials
    const passcode = request.headers.get('x-admin-passcode');
    const configuredPasscode = process.env.ADMIN_PASSCODE || 'dbdb-admin';
    const isAdmin = passcode === configuredPasscode;
    
    const review = await db.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify ownership or administrative override privileges
    const isOwner = reviewerUuid && review.reviewerToken === reviewerUuid;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this review.' }, { status: 403 });
    }

    await db.review.delete({
      where: { id },
    });

    // Recalculate parent bar's amenities tags union after review deletion
    await syncBarAmenities(review.barId);

    return NextResponse.json({ success: true, message: 'Review successfully purged.' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Utility to aggregate and sync all unique amenities from reviews back to the parent bar
async function syncBarAmenities(barId: string) {
  try {
    const siblingReviews = await db.review.findMany({
      where: { barId },
      select: { amenities: true }
    });

    const uniqueAmenities = new Set<string>();
    siblingReviews.forEach(r => {
      if (r.amenities) {
        r.amenities.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) uniqueAmenities.add(trimmed);
        });
      }
    });

    const barAmenitiesString = uniqueAmenities.size > 0 
      ? Array.from(uniqueAmenities).join(',') 
      : null;

    await db.bar.update({
      where: { id: barId },
      data: { amenities: barAmenitiesString }
    });
  } catch (err) {
    console.error('Failed to sync parent bar amenities on update/delete:', err);
  }
}
