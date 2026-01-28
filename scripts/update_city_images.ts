
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Fallback if .env is not in root or failed
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env or .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Hardcoded Unsplash Images (High Quality, Horizontal)
const CITY_DATA: Record<string, { image: string, desc: string }> = {
    'Shanghai': {
        image: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?q=80&w=1920&auto=format&fit=crop',
        desc: '上海，这座充满活力的国际大都市，不仅是中国的经济中心，更是创新与现代化的象征。外滩的万国建筑博览群诉说着历史的沧桑，陆家嘴的摩天大楼则展示着未来的无限可能。在这里，传统与前卫完美融合，多元文化交相辉映，为每一位追梦者提供了广阔的舞台。'
    },
    'Beijing': {
        image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=1920&auto=format&fit=crop',
        desc: '北京，作为中国的首都和政治文化中心，承载着三千年的历史积淀。从巍峨的长城到庄严的故宫，每一砖一瓦都刻画着古老的文明记忆。同时，这里也是科技与艺术的熔炉，中关村的创新活力与798的艺术气息交织，共同绘制出一幅古今辉映的壮丽画卷。'
    },
    'Shenzhen': {
        image: 'https://images.unsplash.com/photo-1634647626782-f5fffa9fd9b1?q=80&w=1740&auto=format&fit=crop', // Shenzhen skyline
        desc: '深圳，这座从渔村崛起的创新之城，是中国改革开放的缩影。作为全球硬件硅谷，这里流淌着创客的血液，充满了敢为人先的精神。高效的城市节奏、包容的社会氛围以及蓬勃的高新科技产业，吸引着无数年轻人才汇聚于此，共同创造着未来的奇迹。'
    },
    'Hangzhou': {
        image: 'https://images.unsplash.com/photo-1640100385267-4b935d8ef86c?q=80&w=1548&auto=format&fit=crop', // West lake / pagoda
        desc: '杭州，素有“人间天堂”的美誉，以其秀美的西湖风光和深厚的人文底蕴闻名于世。如今，作为数字经济的高地，它更是互联网巨头和创新企业的摇篮。在这里，古典园林的宁静与互联网大厂的热闹相得益彰，展现出一种独特的江南韵味与现代智能的和谐共生。'
    },
    'Guangzhou': {
        image: 'https://images.unsplash.com/photo-1553826059-7a090c4a3447?q=80&w=1742&auto=format&fit=crop', // Canton tower night
        desc: '广州，这座拥有两千多年历史的商都，是岭南文化的中心。早茶的烟火气、珠江的璀璨夜景以及包容务实的城市性格，构成了它独特的魅力。作为对外贸易的重要窗口，广州始终保持着开放的姿态，迎接四方宾客，续写着海上丝绸之路的新篇章。'
    },
    'Chengdu': {
        image: 'https://images.unsplash.com/photo-1693858325816-b7a7c1066838?q=80&w=1548&auto=format&fit=crop', // Chengdu vibe
        desc: '成都，一座来了就不想走的城市，以其悠闲的生活方式和丰富的美食文化著称。大熊猫的憨态可掬、火锅的麻辣鲜香、茶馆的悠闲惬意，是这里最生动的注脚。然而，在安逸的表象下，成都也蕴藏着强大的科技实力和创新潜能，是西部地区重要的中心城市。'
    },
    'Nanjing': {
        image: 'https://images.unsplash.com/photo-1721021181177-1f8ad8ee81d7?q=80&w=1740&auto=format&fit=crop', // Nanjing landscape
        desc: '南京，六朝古都，十朝都会，厚重的历史底蕴赋予了它庄重而儒雅的气质。秦淮河畔的桨声灯影、中山陵的巍峨肃穆，见证了这座城市的沧桑巨变。作为科教名城，南京拥有众多高校和科研机构，正以深厚的文化积淀为基础，焕发出新的创新活力。'
    },
    // Fallback for others
    'default': {
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1920&auto=format&fit=crop',
        desc: '这座城市正在蓬勃发展，充满了无限的机遇与可能。每一个角落都孕育着创新的种子，等待着去发现和探索。'
    }
};

async function updateCities() {
    console.log('Fetching cities...');
    const { data: cities, error } = await supabase.from('cities').select('*');
    if (error) {
        console.error('Error fetching cities:', error);
        return;
    }

    console.log(`Found ${cities.length} cities.`);

    for (const city of cities) {
        const metadata = CITY_DATA[city.name] || CITY_DATA['default'];
        
        console.log(`Updating ${city.name} (${city.label})...`);
        
        // Force update image and description if they are in our curated list (CITY_DATA)
        // This ensures the DB reflects our latest manually selected images.
        const updates: any = {};
        
        // Check if image needs update (simple string comparison or just always update)
        if (CITY_DATA[city.name]) {
             // Always update to ensure latest version
             updates.image_url = metadata.image;
             updates.description = metadata.desc;
        } else {
            // For other cities, only fill if empty
            if (!city.image_url) updates.image_url = metadata.image;
            if (!city.description) updates.description = metadata.desc;
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('cities')
                .update(updates)
                .eq('id', city.id);
            
            if (updateError) {
                console.error(`Failed to update ${city.name}:`, updateError);
            } else {
                console.log(`Updated ${city.name}.`);
            }
        } else {
            console.log(`No updates needed for ${city.name}.`);
        }
    }
    console.log('Update complete.');
}

updateCities();
