import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.post('/add', async (req, res) => {
  const { name, label } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'City name is required' });
  }

  try {
      // Check if exists
      const { data: existing } = await supabase
        .from('cities')
        .select('*')
        .eq('name', name)
        .maybeSingle();

      if (existing) {
        return res.json({ success: true, data: existing });
      }

      // Determine image/desc (simple logic or default)
      // In a real app, here we would "crawl Unsplash"
      const defaultImage = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1920&auto=format&fit=crop';
      
      const { data, error } = await supabase
        .from('cities')
        .insert({
          name,
          label: label || name,
          image_url: defaultImage,
          description: `Discover events in ${label || name}`,
          latitude: 0,
          longitude: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Add city error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data });
  } catch (err: any) {
      console.error('Server error adding city', err);
      return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
