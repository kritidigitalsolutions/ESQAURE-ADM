import React, { useState } from 'react';
import { mockGenres } from '../../data/mockOttData';
import {
  Tags,
  Plus,
  Search,
  X,
  Heart,
  ShieldAlert,
  Briefcase,
  Flame,
  Tv,
  Compass,
  Smile,
  Zap,
  Sparkles,
  Edit3,
  Trash2,
  Check
} from 'lucide-react';

const ICON_MAP = {
  Heart,
  ShieldAlert,
  Briefcase,
  Flame,
  Tv,
  Compass,
  Smile,
  Zap,
  Sparkles,
  Tags,
};

const AVAILABLE_ICONS = [
  'Heart',
  'ShieldAlert',
  'Briefcase',
  'Flame',
  'Tv',
  'Compass',
  'Smile',
  'Zap',
  'Sparkles',
  'Tags',
];

const PRESET_COLORS = [
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F97316', // Orange
];

export default function GenresPage() {
  const [genres, setGenres] = useState(mockGenres);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [color, setColor] = useState('#F59E0B');
  const [icon, setIcon] = useState('Heart');
  const [isActive, setIsActive] = useState(true);

  const toggleStatus = (id) => {
    setGenres(prev => prev.map(g => g.id === id ? { ...g, isActive: !g.isActive } : g));
  };

  const handleOpenAdd = () => {
    setEditingGenre(null);
    setName('');
    setColor('#F59E0B');
    setIcon('Heart');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (genre) => {
    setEditingGenre(genre);
    setName(genre.name);
    setColor(genre.color || '#F59E0B');
    setIcon(genre.icon || 'Tags');
    setIsActive(genre.isActive);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setGenres(prev => prev.filter(g => g.id !== id));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (editingGenre) {
      setGenres(prev => prev.map(g => g.id === editingGenre.id ? {
        ...g,
        name: name.trim(),
        slug,
        color,
        icon,
        isActive,
      } : g));
    } else {
      setGenres(prev => [
        ...prev,
        {
          id: `GNR-${Date.now().toString().slice(-3)}`,
          name: name.trim(),
          slug,
          color,
          dramaCount: 0,
          isActive,
          icon,
        }
      ]);
    }
    setIsModalOpen(false);
  };

  const filteredGenres = genres.filter(g =>
    !searchTerm.trim() ||
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-urbanist">

      {/* Clean & Simple Header */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Genres & Categories
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage categories and tags shown in catalog browsing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search genres..."
              className="w-full pl-8 pr-7 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Add Genre Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="py-2.5 px-4 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shrink-0 active:scale-95 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Genre</span>
          </button>
        </div>
      </div>

      {/* Minimal Genres Grid */}
      {filteredGenres.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-nodus">
          <p className="text-xs font-bold text-slate-500">No genres found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 px-3 py-1.5 bg-[#FEF08A] text-slate-950 font-bold text-xs rounded-xl"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredGenres.map((genre) => {
            const IconComponent = ICON_MAP[genre.icon] || Tags;
            const itemColor = genre.color || '#F59E0B';

            return (
              <div
                key={genre.id}
                className="bg-white dark:bg-[#111111] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-nodus flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Top: Icon, Name & Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Dashboard-style subtle tint icon container */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${itemColor}15`,
                        borderColor: `${itemColor}30`,
                        color: itemColor,
                      }}
                    >
                      <IconComponent className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-950 dark:text-white truncate">
                        {genre.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                        /{genre.slug}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge with Live Pulsing Dot */}
                  <button
                    type="button"
                    onClick={() => toggleStatus(genre.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-colors shrink-0 ${
                      genre.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        genre.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {genre.isActive ? 'ACTIVE' : 'HIDDEN'}
                  </button>
                </div>

                {/* Bottom: Associated Catalog & Quick Edit/Delete */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Catalog:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {genre.dramaCount || 0} Series
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(genre)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(genre.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Simple Clean Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-950 dark:text-white">
                {editingGenre ? 'Edit Genre' : 'Add New Genre'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              
              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Genre Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fantasy"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:border-[#FEF08A] focus:outline-none"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Icon
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const Comp = ICON_MAP[iconName] || Tags;
                    const isSelected = icon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#FEF08A] text-slate-950 shadow-xs scale-105'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Comp className="w-4 h-4 stroke-[2.2]" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Preset */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setColor(hex)}
                      className={`w-6 h-6 rounded-md transition-transform flex items-center justify-center ${
                        color.toLowerCase() === hex.toLowerCase() ? 'scale-110 ring-2 ring-slate-950 dark:ring-white' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {color.toLowerCase() === hex.toLowerCase() && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 ml-1 bg-transparent"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Active Status
                </span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                      isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold rounded-xl transition-all shadow-xs"
                >
                  {editingGenre ? 'Save' : 'Create'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
