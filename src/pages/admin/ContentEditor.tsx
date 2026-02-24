import { useState } from 'react';
import { ChevronDown, Search, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { useSiteContent, updateSiteContent } from '@/hooks/useAdminData';
import { useAuth } from '@/hooks/useAuth';
import type { SiteContent } from '@/types/admin';

const sectionLabels: Record<string, string> = {
  hero: 'Hero',
  problems: 'Problems',
  features: 'Features',
  steps: 'How It Works',
  tutorial: 'Tutorial',
  faqs: 'FAQ',
  testimonials: 'Testimonials',
  about_creator: 'About Creator',
  about_optiplan: 'About OptiPlan',
  cta: 'Call to Action',
};

function ContentField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-purple-500/40 transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-purple-500/40 transition-colors"
        />
      )}
    </div>
  );
}

function ArrayField({
  label,
  items,
  onChange,
  renderItem,
}: {
  label: string;
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
  renderItem: (item: Record<string, unknown>, index: number, update: (key: string, value: unknown) => void) => React.ReactNode;
}) {
  const updateItem = (index: number) => (key: string, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{label}</label>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-600 uppercase">Item {i + 1}</p>
            {renderItem(item, i, updateItem(i))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onSave,
  saving,
}: {
  section: SiteContent;
  onSave: (content: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [editContent, setEditContent] = useState<Record<string, unknown>>(
    JSON.parse(JSON.stringify(section.content))
  );

  const updateField = (key: string, value: unknown) => {
    setEditContent(prev => ({ ...prev, [key]: value }));
  };

  // Render string fields
  const stringFields = Object.entries(editContent).filter(
    ([, v]) => typeof v === 'string'
  );

  // Render array fields (items)
  const arrayFields = Object.entries(editContent).filter(
    ([, v]) => Array.isArray(v)
  );

  return (
    <div className="space-y-4">
      {stringFields.map(([key, value]) => (
        <ContentField
          key={key}
          label={key}
          value={value as string}
          onChange={(v) => updateField(key, v)}
          multiline={(value as string).length > 100}
        />
      ))}

      {arrayFields.map(([key, value]) => {
        const items = value as Record<string, unknown>[];
        if (items.length === 0) return null;

        // If it's an array of strings (like checklist, rotatingWords)
        if (typeof items[0] === 'string') {
          return (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{key}</label>
              <div className="space-y-2">
                {(value as string[]).map((item, i) => (
                  <input
                    key={i}
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...(value as string[])];
                      updated[i] = e.target.value;
                      updateField(key, updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 outline-none focus:border-purple-500/40 transition-colors"
                  />
                ))}
              </div>
            </div>
          );
        }

        return (
          <ArrayField
            key={key}
            label={key}
            items={items}
            onChange={(updated) => updateField(key, updated)}
            renderItem={(item, _i, update) => (
              <>
                {Object.entries(item).map(([itemKey, itemValue]) => {
                  if (Array.isArray(itemValue)) {
                    return (
                      <div key={itemKey}>
                        <label className="block text-xs text-gray-500 mb-1">{itemKey}</label>
                        <div className="space-y-1">
                          {(itemValue as string[]).map((subItem, si) => (
                            <input
                              key={si}
                              type="text"
                              value={subItem as string}
                              onChange={(e) => {
                                const updated = [...(itemValue as string[])];
                                updated[si] = e.target.value;
                                update(itemKey, updated);
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200 outline-none focus:border-purple-500/40 transition-colors"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <ContentField
                      key={itemKey}
                      label={itemKey}
                      value={String(itemValue ?? '')}
                      onChange={(v) => update(itemKey, v)}
                      multiline={String(itemValue ?? '').length > 80}
                    />
                  );
                })}
              </>
            )}
          />
        );
      })}

      <button
        onClick={() => onSave(editContent)}
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save Section
      </button>
    </div>
  );
}

export function ContentEditor() {
  const { content, loading, refetch } = useSiteContent();
  const { profile } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);

  const filteredSections = content.filter((s) =>
    (sectionLabels[s.section_key] ?? s.section_key).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSave = async (section: SiteContent, newContent: Record<string, unknown>) => {
    if (!profile) return;
    setSaving(section.section_key);
    try {
      await updateSiteContent(
        section.section_key,
        { content: newContent },
        profile.id,
        profile.display_name ?? profile.email,
      );
      refetch();
    } catch (err) {
      console.error('Failed to save:', err);
    }
    setSaving(null);
  };

  const handleToggleVisibility = async (section: SiteContent) => {
    if (!profile) return;
    setTogglingVisibility(section.section_key);
    try {
      await updateSiteContent(
        section.section_key,
        { visible: !section.visible },
        profile.id,
        profile.display_name ?? profile.email,
      );
      refetch();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
    setTogglingVisibility(null);
  };

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
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-[#18162e] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSections.map((section) => {
            const isExpanded = expandedSection === section.section_key;
            const label = sectionLabels[section.section_key] ?? section.section_key;

            return (
              <div key={section.section_key}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : section.section_key)}
                    className="flex-1 flex items-center justify-between px-5 py-4 rounded-lg bg-[#18162e] border border-white/10 hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-200">{label}</span>
                      {!section.visible && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">
                          Hidden
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => handleToggleVisibility(section)}
                    disabled={togglingVisibility === section.section_key}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                      section.visible
                        ? 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                        : 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                    } disabled:opacity-50`}
                    title={section.visible ? 'Hide section' : 'Show section'}
                  >
                    {togglingVisibility === section.section_key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : section.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-1 rounded-lg bg-[#18162e]/50 border border-white/[0.06] px-5 py-6">
                    <SectionEditor
                      section={section}
                      onSave={(newContent) => handleSave(section, newContent)}
                      saving={saving === section.section_key}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
