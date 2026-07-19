import { NextResponse } from 'next/server';
import { verifyCredentials, getEffectiveUsername, makeToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    const ok = await verifyCredentials(String(username), String(password));
    if (!ok) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    const username2 = await getEffectiveUsername();
    return NextResponse.json({
      success: true,
      token: makeToken(username2),
      username: username2,
    });
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }
}
