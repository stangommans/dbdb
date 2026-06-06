import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrCreateReviewerToken, setReviewerCookie } from '@/lib/session';

export async function GET() {
  try {
    const { uuid: reviewerUuid, rawToken, isNew } = await getOrCreateReviewerToken();

    const feedbackItems = await db.feedback.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const safeFeedbackItems = feedbackItems.map((item) => ({
      id: item.id,
      content: item.content,
      status: item.status,
      adminComment: item.adminComment,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isOwner: item.reviewerToken === reviewerUuid,
    }));

    const response = NextResponse.json(safeFeedbackItems, { status: 200 });
    
    if (isNew) {
      await setReviewerCookie(rawToken);
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Feedback content cannot be empty' }, { status: 400 });
    }

    const { uuid: reviewerUuid, rawToken, isNew } = await getOrCreateReviewerToken();

    const newFeedback = await db.feedback.create({
      data: {
        content: content.trim(),
        reviewerToken: reviewerUuid,
      },
    });

    const response = NextResponse.json({
      id: newFeedback.id,
      content: newFeedback.content,
      status: newFeedback.status,
      adminComment: newFeedback.adminComment,
      createdAt: newFeedback.createdAt,
      updatedAt: newFeedback.updatedAt,
      isOwner: true,
    }, { status: 201 });

    if (isNew) {
      await setReviewerCookie(rawToken);
    }

    return response;
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
