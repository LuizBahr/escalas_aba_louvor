import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Signup disabled - open access' }, { status: 200 });
}
