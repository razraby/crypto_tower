import React, { useEffect, useMemo, useState } from 'react';
import { wikiArticles } from '../data/wiki';
import { BookOpen, Search } from 'lucide-react';

interface WikiPanelProps {
  onClose?: () => void;
}

export default function WikiPanel({ onClose }: WikiPanelProps) {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(wikiArticles[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizeSearch = (value: string) =>
    value
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/gi, ' ')
      .trim();

  const normalizedQuery = normalizeSearch(searchQuery);

  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) return wikiArticles;

    return wikiArticles.filter((art) => {
      const searchable = normalizeSearch([
        art.title,
        art.category,
        ...(art.aliases || []),
      ].join(' '));

      return searchable.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  useEffect(() => {
    if (filteredArticles.length === 0) return;
    if (!filteredArticles.some((art) => art.id === selectedArticleId)) {
      setSelectedArticleId(filteredArticles[0].id);
    }
  }, [filteredArticles, selectedArticleId]);

  const selectedArticle =
    filteredArticles.find((a) => a.id === selectedArticleId) ||
    filteredArticles[0] ||
    wikiArticles[0];

  return (
    <div id="medieval-wiki-codex" className="flex-1 flex flex-col md:flex-row bg-[#060a13] border-4 border-[#1e2d4a] rounded-lg overflow-hidden h-full shadow-2xl relative">
      
      {/* Decorative metal rivets/studs at corners */}
      <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-[#829ab1] to-[#102a43] border border-black/40 shadow-md z-10"></div>
      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-[#829ab1] to-[#102a43] border border-black/40 shadow-md z-10"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-[#829ab1] to-[#102a43] border border-black/40 shadow-md z-10"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-[#829ab1] to-[#102a43] border border-black/40 shadow-md z-10"></div>

      {/* Sidebar: Articles List (Embossed Leather Book Cover Theme) */}
      <div className="w-full md:w-76 border-b md:border-b-0 md:border-r-4 border-[#1e2d4a] flex flex-col p-5 shrink-0 bg-[#060a13] text-parchment-100 z-10">
        
        {/* Header Title with ornamental gold banner */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-parchment-900/40">
          <div className="flex items-center gap-2">
            <BookOpen className="text-parchment-400 animate-pulse" size={18} />
            <h2 className="text-sm font-display font-bold text-parchment-200 tracking-wider uppercase">
              Гримуар Шифров
            </h2>
          </div>
          {onClose && <span className="sr-only">Закрытие энциклопедии вынесено в правый верхний угол окна.</span>}
        </div>

        {/* Search Field styled as vintage library catalogue */}
        <div className="relative mb-5">
          <input
            type="text"
            placeholder="Искать в фолианте..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a1120] border border-parchment-800/50 rounded px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-parchment-400 focus:ring-1 focus:ring-parchment-500/30 transition-all font-serif placeholder:text-parchment-700/60"
          />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-600" />
        </div>

        {/* Scrollable list of articles with leather trim button aesthetics */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((art) => {
              const isSelected = art.id === selectedArticleId;
              return (
                <button
                  key={art.id}
                  onClick={() => setSelectedArticleId(art.id)}
                  className={`w-full text-left p-3 rounded-md border transition-all duration-200 cursor-pointer flex flex-col gap-1.5 relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#1e2d4a] to-[#0f172a] border-parchment-400 shadow-md shadow-black/50'
                      : 'bg-transparent border-parchment-950 hover:bg-[#121d33]/40 hover:border-parchment-900/30'
                  }`}
                >
                  {/* Selected Marker resembling a gold gild ribbon */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 to-parchment-600"></div>
                  )}
                  
                  <span className="text-[10px] font-display font-bold text-parchment-500 uppercase tracking-widest leading-none">
                    {art.category}
                  </span>
                  <span className={`text-sm font-display font-bold leading-tight ${isSelected ? 'text-parchment-200' : 'text-parchment-400 group-hover:text-parchment-200'}`}>
                    {art.title}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs text-parchment-600 font-serif italic">
              Ничего не найдено в фолианте...
            </div>
          )}
        </div>

        {/* Medieval Quote Footnote */}
        <div className="mt-5 pt-4 border-t border-parchment-900/40 text-[11px] font-serif text-parchment-500/80 leading-relaxed italic text-center">
          «Слово сокрытое сияет ярче серебра в руках мудреца.»
        </div>
      </div>

      {/* Main Content Area: Article Viewer (Ancient Dark-Blue & Iron Manuscript Theme) */}
      <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-[#121d33] via-[#0a1120] to-[#060a13] flex flex-col gap-6 select-text shadow-inner">
        
        {/* Title Block with calligraphic framing and vintage feel */}
        <div className="border-b-2 border-[#1e2d4a] pb-5 shrink-0 relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-display bg-[#1e2d4a]/40 border border-[#334e68]/30 text-parchment-300 px-3 py-1 rounded-sm uppercase font-bold tracking-wider">
              {selectedArticle.category}
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-parchment-50 tracking-wide">
            {selectedArticle.title}
          </h1>
          {/* Ornamental scroll pattern */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <BookOpen size={64} className="text-[#334e68]" />
          </div>
        </div>

        {/* Formatted Article Content with Custom Calligraphy & Ink Text */}
        <div className="text-parchment-100 space-y-5 text-base leading-relaxed max-w-4xl whitespace-pre-line font-serif">
          {selectedArticle.content.split('\n\n').map((paragraph, index) => {
            // Apply dropcap to the first paragraph (if not starting with headers)
            const isFirstParagraph = index === 0 && !paragraph.startsWith('###') && !paragraph.startsWith('>');
            
            // Check for headings
            if (paragraph.startsWith('###')) {
              return (
                <h3 key={index} className="text-xl font-display font-bold text-parchment-200 border-b-2 border-parchment-700/30 pb-1 mt-6 mb-3 flex items-center gap-2">
                  <span className="text-parchment-400 text-lg">✦</span>
                  {paragraph.replace('###', '').trim()}
                </h3>
              );
            }
            
            // Check for list items
            if (paragraph.startsWith('*') || paragraph.startsWith('-') || paragraph.match(/^\d+\./)) {
              return (
                <div key={index} className="pl-5 border-l-2 border-parchment-700/20 space-y-2.5 my-3 bg-[#486581]/15 p-3 rounded-r-md">
                  {paragraph.split('\n').map((li, lidx) => (
                    <div key={lidx} className="flex gap-2.5 text-sm md:text-base text-parchment-200 font-serif">
                      <span className="text-parchment-400 font-bold shrink-0 select-none">✠</span>
                      <span>{li.replace(/^[\s*\-\d.]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              );
            }
            
            // Check for blockquotes
            if (paragraph.startsWith('>')) {
              return (
                <blockquote key={index} className="bg-[#486581]/10 border-l-4 border-parchment-600 p-4 rounded-r-md text-sm md:text-base text-parchment-200 italic my-3 pl-5 shadow-sm">
                  {paragraph.replace(/^>\s*/, '').trim()}
                </blockquote>
              );
            }

            return (
              <p 
                key={index} 
                className={`text-parchment-200 font-serif leading-relaxed text-justify text-base md:text-lg ${
                  isFirstParagraph ? 'medieval-dropcap' : ''
                }`}
              >
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Vintage Math & Formulas Banner */}
        {selectedArticle.formula && (
          <div className="bg-[#0a1120] border-2 border-dashed border-[#1e2d4a] rounded-lg p-5 max-w-4xl shadow-inner mt-4">
            <span className="text-[11px] uppercase font-display font-bold text-parchment-300 block mb-2.5 tracking-wider">
              Криптографический Метод Сокрытия
            </span>
            <div className="text-center font-mono text-base font-bold text-white bg-[#060a13] p-4 rounded-md border border-[#1e2d4a] shadow-md">
              {selectedArticle.formula}
            </div>
            {selectedArticle.example && (
              <p className="text-xs text-parchment-300 font-serif mt-3 leading-relaxed italic">
                <span className="text-parchment-100 font-bold font-display not-italic">Пример:</span> {selectedArticle.example}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
