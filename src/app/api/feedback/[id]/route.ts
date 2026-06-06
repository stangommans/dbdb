import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrCreateReviewerToken } from '@/lib/session';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { content, status } = body;

    const feedback = await db.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const { uuid: reviewerUuid } = await getOrCreateReviewerToken();
    const isOwner = feedback.reviewerToken === reviewerUuid;

    // Validate admin credentials
    const passcode = request.headers.get('x-admin-passcode');
    const configuredPasscode = process.env.ADMIN_PASSCODE || 'dbdb-admin';
    const isAdmin = passcode === configuredPasscode;

    // Build update object
    const updateData: { content?: string; status?: string; adminComment?: string | null } = {};

    if (content !== undefined) {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized. You do not own this feedback and are not an admin.' }, { status: 403 });
      }
      if (typeof content !== 'string' || content.trim() === '') {
        return NextResponse.json({ error: 'Feedback content cannot be empty' }, { status: 400 });
      }
      updateData.content = content.trim();
    }

    if (status !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized. Only admins can update status.' }, { status: 403 });
      }
      if (typeof status !== 'string' || status.trim() === '') {
        return NextResponse.json({ error: 'Status cannot be empty' }, { status: 400 });
      }
      updateData.status = status.trim();
    }

    const { adminComment } = body;
    if (adminComment !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized. Only admins can update admin comments.' }, { status: 403 });
      }
      updateData.adminComment = adminComment === null ? null : String(adminComment).trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedFeedback = await db.feedback.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedFeedback.id,
      content: updatedFeedback.content,
      status: updatedFeedback.status,
      adminComment: updatedFeedback.adminComment,
      createdAt: updatedFeedback.createdAt,
      updatedAt: updatedFeedback.updatedAt,
      isOwner,
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const feedback = await db.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const { uuid: reviewerUuid } = await getOrCreateReviewerToken();
    const isOwner = feedback.reviewerToken === reviewerUuid;

    // Validate admin credentials
    const passcode = request.headers.get('x-admin-passcode');
    const configuredPasscode = process.env.ADMIN_PASSCODE || 'dbdb-admin';
    const isAdmin = passcode === configuredPasscode;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this feedback.' }, { status: 403 });
    }

    await db.feedback.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Feedback successfully purged.' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
