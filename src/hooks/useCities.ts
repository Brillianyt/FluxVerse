import { useState, useEffect } from 'react';
import { getCities } from '../lib/database';
import { City } from '../types';

export type { City };

const DEFAULT_CITIES: City[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Shanghai', label: '上海', slug: 'shanghai', latitude: 31.2304, longitude: 121.4737, description: '上海，这座充满活力的国际大都市，不仅是中国的经济中心，更是创新与现代化的象征。外滩的万国建筑博览群诉说着历史的沧桑，陆家嘴的摩天大楼则展示着未来的无限可能。在这里，传统与前卫完美融合，多元文化交相辉映，为每一位追梦者提供了广阔的舞台。', cover_image_url: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?q=80&w=1920&auto=format&fit=crop' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Beijing', label: '北京', slug: 'beijing', latitude: 39.9042, longitude: 116.4074, description: '北京，作为中国的首都和政治文化中心，承载着三千年的历史积淀。从巍峨的长城到庄严的故宫，每一砖一瓦都刻画着古老的文明记忆。同时，这里也是科技与艺术的熔炉，中关村的创新活力与798的艺术气息交织，共同绘制出一幅古今辉映的壮丽卷。', cover_image_url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=1920&auto=format&fit=crop' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Shenzhen', label: '深圳', slug: 'shenzhen', latitude: 22.5429, longitude: 114.0596, description: '深圳，这座从渔村崛起的创新之城，是中国改革开放的缩影。作为全球硬件硅谷，这里流淌着创客的血液，充满了敢为人先的精神。高效的城市节奏、包容的社会氛围以及蓬勃的高新科技产业，吸引着无数年轻人才汇聚于此，共同创造着未来的奇迹。', cover_image_url: 'https://images.unsplash.com/photo-1634647626782-f5fffa9fd9b1?q=80&w=1740&auto=format&fit=crop' },
];

export const useCities = () => {
    const [cities, setCities] = useState<City[]>(DEFAULT_CITIES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        
        const fetchCities = async () => {
            try {
                const data = await getCities();
                if (mounted) {
                    if (data && data.length > 0) {
                        setCities(data);
                    } else {
                        console.log('No DB data, using local defaults');
                        setCities(DEFAULT_CITIES);
                    }
                }
            } catch (error) {
                console.error("Failed to load cities, using local defaults", error);
                setCities(DEFAULT_CITIES);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchCities();

        return () => { mounted = false; };
    }, []);

    return { cities, loading };
};
