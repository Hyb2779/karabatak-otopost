import { NextResponse } from 'next/server';
import {
  getEffectiveUsername,
  verifyCredentials,
  setCredentials,
} from '@/lib/auth';

// GET -> mevcut kullanıcı adını döndür (şifre ASLA döndürülmez)
export async function GET() {
  try {
    const username = await getEffectiveUsername();
    return NextResponse.json({ username });
  } catch {
    return NextResponse.json({ username: 'admin' });
  }
}

// POST -> mevcut şifreyi doğrulayıp yeni kullanıcı adı/şifre kaydet
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { current_password, new_username, new_password } = body;

    if (!current_password) {
      return NextResponse.json(
        { error: 'Mevcut şifrenizi girin' },
        { status: 400 }
      );
    }

    const currentUsername = await getEffectiveUsername();

    // Mevcut şifre doğru mu?
    const ok = await verifyCredentials(currentUsername, String(current_password));
    if (!ok) {
      return NextResponse.json(
        { error: 'Mevcut şifre hatalı' },
        { status: 401 }
      );
    }

    const finalUsername = (new_username && String(new_username).trim()) || currentUsername;
    // Yeni şifre verilmediyse mevcut şifre korunur
    const finalPassword = new_password && String(new_password).length > 0
      ? String(new_password)
      : String(current_password);

    if (String(finalUsername).trim().length < 3) {
      return NextResponse.json(
        { error: 'Kullanıcı adı en az 3 karakter olmalı' },
        { status: 400 }
      );
    }
    if (finalPassword.length < 4) {
      return NextResponse.json(
        { error: 'Şifre en az 4 karakter olmalı' },
        { status: 400 }
      );
    }

    await setCredentials(finalUsername, finalPassword);

    return NextResponse.json({ success: true, username: finalUsername });
  } catch (error) {
    console.error('Error updating credentials:', error);
    return NextResponse.json(
      { error: 'Giriş bilgileri güncellenemedi' },
      { status: 500 }
    );
  }
}
