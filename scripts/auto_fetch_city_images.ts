
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// 优先使用 service_role 保证有权限更新数据
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'CULOP5-CVg6IdlEQV5-BI05wFS3O1uip0hGk2MjesIQ';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchUnsplash(pinyinName: string) {
  try {
    // 尝试不同的搜索词
    const queries = [
      `${pinyinName} city skyline`,
      `${pinyinName} city`,
      pinyinName
    ];

    for (const query of queries) {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
      
      const res = await fetch(url);
      const data: any = await res.json();
      
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        return {
          cover: photo.urls.regular,
          icon: photo.urls.thumb
        };
      }
    }
  } catch (err) {
    console.error(`Error searching image for ${pinyinName}:`, err);
  }
  return null;
}

async function start() {
  console.log('--- 开始检查城市图片状态 ---');
  
  const { data: cities, error } = await supabase
    .from('cities')
    .select('id, name, label, icon_url, cover_image_url');

  if (error) {
    console.error('获取城市列表失败:', error);
    return;
  }

  console.log(`当前数据库中共有 ${cities.length} 个城市。`);

  for (const city of cities) {
    // 判断逻辑：如果任一图片 URL 为空，则触发补全
    if (!city.cover_image_url || !city.icon_url) {
      console.log(`城市 [${city.label} (${city.name})] 缺少图片，正在从 Unsplash 补全...`);
      
      const images = await searchUnsplash(city.name);
      
      if (images) {
        const updates: any = {};
        if (!city.cover_image_url) updates.cover_image_url = images.cover;
        if (!city.icon_url) updates.icon_url = images.icon;

        const { error: updateErr } = await supabase
          .from('cities')
          .update(updates)
          .eq('id', city.id);

        if (updateErr) {
          console.error(`更新城市 ${city.label} 失败:`, updateErr.message);
        } else {
          console.log(`成功更新 ${city.label} 的图片链接。`);
        }
      } else {
        console.warn(`未能在 Unsplash 找到城市 ${city.label} 的合适图片。`);
      }
      
      // 稍微延迟避免 API 频率限制
      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.log(`城市 [${city.label}] 的图片已存在，跳过。`);
    }
  }
  
  console.log('--- 处理任务完成 ---');
}

start();
