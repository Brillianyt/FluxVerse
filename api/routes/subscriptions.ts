import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-key-change-me';

const getUserIdFromToken = (req: Request): string | null => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded?.id || null;
  } catch {
    return null;
  }
};

const ensureProfileExists = async (userId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (!data) {
    await supabase.from('profiles').insert({
      id: userId,
      username: 'User',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      description: ''
    });
  }
};

router.post('/subscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    const { eventId } = req.body || {};
    if (!userId || !eventId) {
      res.status(400).json({ error: 'Missing user or eventId' });
      return;
    }

    await ensureProfileExists(userId);

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('ac_id', eventId)
      .maybeSingle();
    if (existing) {
      res.json({ success: true });
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        ac_id: eventId,
        information: 'Subscribed',
        is_read: false
      });
    if (error) {
      res.status(500).json({ error: 'Failed to subscribe' });
      return;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    const { eventId } = req.body || {};
    if (!userId || !eventId) {
      res.status(400).json({ error: 'Missing user or eventId' });
      return;
    }
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('ac_id', eventId);
    if (error) {
      res.status(500).json({ error: 'Failed to unsubscribe' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
});

router.get('/my', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        activity:activities(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
      return;
    }
    res.json({ data });
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
});

router.get('/is-subscribed', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    const eventId = (req.query.eventId as string) || '';
    if (!userId || !eventId) {
      res.status(400).json({ error: 'Missing user or eventId' });
      return;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('ac_id', eventId)
      .limit(1);
    if (error) {
      res.status(500).json({ error: 'Failed to check subscription' });
      return;
    }
    res.json({ subscribed: (data || []).length > 0 });
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
