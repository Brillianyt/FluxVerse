import React, { useState, useMemo } from 'react';
import { X, ChevronRight, MapPin, ChevronLeft, Search } from 'lucide-react';
import cityData from '../assets/city.json';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cityName: string) => void;
  hotCities?: { name: string; label: string }[]; // Optional hot cities for quick select
  showHotCities?: boolean;
}

interface Province {
  provinceName: string;
  citys: {
    cityName: string;
    cityType: string;
  }[];
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  hotCities = [],
  showHotCities = true
}) => {
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cast imported json to typed structure
  const provinces = (cityData as any).provinces as Province[];

  const filteredProvinces = useMemo(() => {
    if (!searchTerm) return provinces;
    return provinces.filter(p => 
      p.provinceName.includes(searchTerm) || 
      p.citys.some(c => c.cityName.includes(searchTerm))
    );
  }, [provinces, searchTerm]);

  const handleProvinceClick = (province: Province) => {
    setSelectedProvince(province);
  };

  const handleCityClick = (cityName: string) => {
    onSelect(cityName);
    onClose();
  };

  const handleBack = () => {
    setSelectedProvince(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            {selectedProvince && (
               <button onClick={handleBack} className="p-1 hover:bg-slate-100 rounded-full transition-colors mr-1">
                 <ChevronLeft size={20} className="text-slate-600" />
               </button>
            )}
            <h2 className="text-lg font-bold text-slate-800">
              {selectedProvince ? selectedProvince.provinceName : '选择城市'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
           {/* Search Bar (Only in root view) */}
           {!selectedProvince && (
             <div className="px-6 py-3 border-b border-gray-100 bg-slate-50/50">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                    type="text" 
                    placeholder="搜索省份或城市..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                 />
               </div>
             </div>
           )}

           <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              
              {/* Hot Cities Section */}
              {!selectedProvince && showHotCities && hotCities.length > 0 && !searchTerm && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">热门城市</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {hotCities.map(city => (
                      <button
                        key={city.name}
                        onClick={() => handleCityClick(city.label)}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 border border-slate-100 transition-all group"
                      >
                        <MapPin size={16} className="mb-1.5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                        <span className="text-sm font-medium">{city.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Province List or City List */}
              {!selectedProvince ? (
                <div>
                   {(!searchTerm || searchTerm) && (
                      <>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                           {searchTerm ? '搜索结果' : '选择省份'}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                           {/* If searching, show cities directly if they match, or provinces */}
                           {searchTerm ? (
                              <>
                                {/* Matched Provinces */}
                                {filteredProvinces.map(p => (
                                    <button
                                        key={p.provinceName}
                                        onClick={() => handleProvinceClick(p)}
                                        className="text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all flex items-center justify-between group"
                                    >
                                        <span className="font-medium text-slate-700">{p.provinceName}</span>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                                    </button>
                                ))}
                                {/* Matched Cities (Flattened) */}
                                {provinces.flatMap(p => p.citys.filter(c => c.cityName.includes(searchTerm)).map(c => ({...c, provinceName: p.provinceName})))
                                    .map(c => (
                                        <button
                                            key={c.cityName}
                                            onClick={() => handleCityClick(c.cityName)}
                                            className="text-left px-4 py-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition-all flex flex-col group shadow-sm"
                                        >
                                            <span className="font-medium text-slate-700 group-hover:text-teal-700">{c.cityName}</span>
                                            <span className="text-xs text-slate-400">{c.provinceName}</span>
                                        </button>
                                    ))
                                }
                              </>
                           ) : (
                               provinces.map(province => (
                                  <button
                                    key={province.provinceName}
                                    onClick={() => handleProvinceClick(province)}
                                    className="text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all flex items-center justify-between group"
                                  >
                                    <span className="font-medium text-slate-700">{province.provinceName}</span>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                                  </button>
                               ))
                           )}
                        </div>
                      </>
                   )}
                </div>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        {selectedProvince.provinceName} - 城市列表
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedProvince.citys.map(city => (
                            <button
                                key={city.cityName}
                                onClick={() => handleCityClick(city.cityName)}
                                className="text-left px-4 py-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition-all shadow-sm flex items-center justify-between group"
                            >
                                <span className="font-medium text-slate-700 group-hover:text-teal-700">{city.cityName}</span>
                            </button>
                        ))}
                    </div>
                </div>
              )}

           </div>
        </div>
      </div>
    </div>
  );
};
