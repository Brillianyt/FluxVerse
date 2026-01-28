import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllEvents } from '../lib/database';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { Search, Filter, Map as MapIcon, Grid } from 'lucide-react';
import { Map } from '../components/Map';

export const Discovery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const categories = ['All', 'Tech', 'Art', 'Health', 'Music', 'Business', 'Social'];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Fetch all events via the unified database service
        const allEvents = await getAllEvents();
        
        // Filter in memory for now since DB doesn't support complex filtering yet
        let filteredData = allEvents;

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredData = filteredData.filter(e => 
            e.title.toLowerCase().includes(term) || 
            e.description.toLowerCase().includes(term) ||
            (e.location_name && e.location_name.toLowerCase().includes(term))
          );
        }

        if (selectedCategory !== 'All') {
          // Note: Category field is currently not fully supported in DB schema, 
          // so this might filter out everything if category is undefined on events.
          // For now, we'll try to match loosely or disable strict filtering if needed.
          filteredData = filteredData.filter(e => e.category === selectedCategory);
        }

        setEvents(filteredData);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchTerm, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm, category: selectedCategory });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchParams({ q: searchTerm, category: category });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Discover Events</h1>
        
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
             <Filter size={16} /> Filters
           </button>
           <button 
             onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
             className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
           >
             {viewMode === 'grid' ? <MapIcon size={16} /> : <Grid size={16} />} 
             {viewMode === 'grid' ? 'Map View' : 'Grid View'}
           </button>
        </div>
      </div>

      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative max-w-lg mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            placeholder="Search for events, locations, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : events.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-sm border border-gray-200">
             <Map events={events} />
          </div>
        )
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
            }}
            className="mt-4 text-primary font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
