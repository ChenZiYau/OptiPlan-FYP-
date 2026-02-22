import { useState } from 'react';
import { ChevronDown, Check, RotateCcw, Search } from 'lucide-react';

const sections = [
  'Hero',
  'Hero Cards',
  'Problems',
  'Features',
  'Roadmap',
  'Tutorial',
  'FAQ',
  'Feedback Form',
  'Testimonials',
  'About Creator',
];

export function ContentEditor() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = sections.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Website Content Editor</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-300 placeholder:text-gray-600 outline-none w-36"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            <Check className="w-3.5 h-3.5" />
            Save as Defaults
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-white/10 text-sm font-medium text-gray-400 hover:text-white hover:border-white/20 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-2">
        {filteredSections.map((section) => {
          const isExpanded = expandedSection === section;
          return (
            <div key={section}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-lg bg-[#18162e] border border-white/10 hover:border-white/15 transition-colors"
              >
                <span className="text-sm font-medium text-gray-200">{section}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="mt-1 rounded-lg bg-[#18162e]/50 border border-white/[0.06] px-5 py-6">
                  <p className="text-sm text-gray-500 italic">
                    Content editor for "{section}" section coming soon.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
