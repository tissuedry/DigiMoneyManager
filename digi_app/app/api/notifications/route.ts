import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached, setCache, clearCache } from '@/lib/route-cache';

// GET: Fetch notifications for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');

    const cacheKey = `notif:${userId}:${cursor ?? 'first'}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const notifications = await prisma.notification.findMany({
      take: 10,
      ...(cursor ? {
        skip: 1,
        cursor: { id: parseInt(cursor) },
      } : {}),
      where: { userId: parseInt(userId, 10) },
      orderBy: { timestamp: 'desc' },
    });

    const lastNotif = notifications[notifications.length - 1];
    const nextCursor = lastNotif ? lastNotif.id : null;

    const [totalCount, unreadCount] = await Promise.all([
      prisma.notification.count({ where: { userId: parseInt(userId, 10) } }),
      prisma.notification.count({ where: { userId: parseInt(userId, 10), dibaca: false } }),
    ]);

    const resp = { notifications, nextCursor, totalCount, unreadCount };
    setCache(cacheKey, resp);
    return NextResponse.json(resp);
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// PUT: Mark notification(s) as read
export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (id) {
      const existing = await prisma.notification.findFirst({
        where: { id: parseInt(id, 10), userId: parseInt(userId, 10) },
      });

      if (!existing) {
        return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
      }

      const updated = await prisma.notification.update({
        where: { id: parseInt(id, 10) },
        data: { dibaca: true },
      });

      clearCache(`notif:${userId}`);
      return NextResponse.json({ message: 'Notification marked as read', notification: updated });
    } else {
      await prisma.notification.updateMany({
        where: { userId: parseInt(userId, 10), dibaca: false },
        data: { dibaca: true },
      });

      clearCache(`notif:${userId}`);
      return NextResponse.json({ message: 'All notifications marked as read' });
    }
  } catch (error: any) {
    console.error('Update notification error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
