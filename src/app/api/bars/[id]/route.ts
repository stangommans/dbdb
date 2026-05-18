import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Validate administrative override credentials
    const passcode = request.headers.get('x-admin-passcode');
    const configuredPasscode = process.env.ADMIN_PASSCODE || 'dbdb-admin';
    
    if (!passcode || passcode !== configuredPasscode) {
      return NextResponse.json({ error: 'Unauthorized. Invalid admin passcode.' }, { status: 401 });
    }

    const bar = await db.bar.findUnique({
      where: { id },
    });

    if (!bar) {
      return NextResponse.json({ error: 'Bar not found' }, { status: 404 });
    }

    // Delete bar (cascade deletes associated reviews automatically via schema configurations)
    await db.bar.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Bar and all associated reviews successfully purged.' });
  } catch (error) {
    console.error('Error deleting bar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
