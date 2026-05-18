import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passcode } = body;
    
    const configuredPasscode = process.env.ADMIN_PASSCODE || 'dbdb-admin';
    
    if (passcode === configuredPasscode) {
      return NextResponse.json({ success: true, message: 'Admin passcode successfully authenticated.' });
    }
    
    return NextResponse.json({ error: 'Invalid administrative passcode.' }, { status: 401 });
  } catch (error) {
    console.error('Error verifying admin passcode:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
