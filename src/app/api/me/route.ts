import { NextResponse } from 'next/server';
import { getOrCreateReviewerToken, setReviewerCookie } from '@/lib/session';

export async function GET() {
  try {
    const { uuid, rawToken, isNew } = await getOrCreateReviewerToken();
    const response = NextResponse.json({ uuid });
    
    // Write cookie back to client if it was newly minted on first load
    if (isNew) {
      await setReviewerCookie(rawToken);
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching session identity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
