import { useState } from 'react';
import { ChevronDown, Search, Eye, EyeOff, Loader2, Save, RotateCcw } from 'lucide-react';
import { useSiteContent, updateSiteContent } from '@/hooks/useAdminData';
import { useAuth } from '@/hooks/useAuth';
import { siteDefaults, sectionColorFields } from '@/constants/siteDefaults';
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

const sectionOrder = [
  'hero',
  'problems',
  'features',
  'steps',
  'tutorial',
  'about_creator',
  'about_optiplan',
  'faqs',
  'testimonials',
  'cta',
];

// Define maximum character limits for specific field names
const MAX_LENGTHS: Record<string, number> = {
  title: 60,
  description: 150,
  headline: 80,
  subheadline: 200,
  content: 300,
  name: 50,
  role: 50,
  question: 100,
  answer: 400,
};

function ContentField({
  label,
  value,
  onChange,
  multiline = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  error?: string;
}) {
  const maxLength = MAX_LENGTHS[label.toLowerCase()] || 500;
  const isOverLimit = value.length > maxLength;
  
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="block text-xs font-medium text-gray-500">{label}</label>
        <span className={`text-[10px] ${isOverLimit ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
          {value.length} / {maxLength}
        </span>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 rounded-lg bg-white/5 border ${isOverLimit || error ? 'border-red-500/50 focus:border-red-500/80' : 'border-white/10 focus:border-purple-500/40'} text-sm text-gray-200 placeholder:text-gray-600 outline-none transition-colors resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg bg-white/5 border ${isOverLimit || error ? 'border-red-500/50 focus:border-red-500/80' : 'border-white/10 focus:border-purple-500/40'} text-sm text-gray-200 placeholder:text-gray-600 outline-none transition-colors`}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {isOverLimit && !error && <p className="mt-1 text-xs text-red-400">Exceeds character limit of {maxLength}</p>}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
      />
      <span className="text-xs text-gray-400 flex-1">{label}</span>
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
        >
          Reset
        </button>
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
  onReset,
  saving,
  resetting,
}: {
  section: SiteContent;
  onSave: (content: Record<string, unknown>) => void;
  onReset: () => void;
  saving: boolean;
  resetting: boolean;
}) {
  const [editContent, setEditContent] = useState<Record<string, unknown>>(
    JSON.parse(JSON.stringify(section.content))
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const textColors = (editContent.textColors ?? {}) as Record<string, string>;
  const colorFields = sectionColorFields[section.section_key] ?? [];

  const updateField = (key: string, value: unknown) => {
    setEditContent(prev => ({ ...prev, [key]: value }));
    setErrorMsg(null);
  };

  const updateColor = (key: string, value: string) => {
    setEditContent(prev => ({
      ...prev,
      textColors: { ...(prev.textColors as Record<string, string> ?? {}), [key]: value },
    }));
  };

  // Render string fields (exclude textColors object)
  const stringFields = Object.entries(editContent).filter(
    ([k, v]) => typeof v === 'string' && k !== 'textColors'
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

      {colorFields.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Text Colors</label>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
            {colorFields.map(({ key, label }) => (
              <ColorField
                key={key}
                label={label}
                value={textColors[key] ?? ''}
                onChange={(v) => updateColor(key, v)}
              />
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            // Recursive limit validation
            let hasError = false;

            const validateObject = (obj: any) => {
              for (const [k, v] of Object.entries(obj)) {
                if (typeof v === 'string') {
                  const max = MAX_LENGTHS[k.toLowerCase()] || 500;
                  if (v.length > max) {
                    hasError = true;
                    setErrorMsg(`Field "${k}" exceeds its character limit of ${max}`);
                    return;
                  }
                } else if (Array.isArray(v)) {
                  v.forEach(item => {
                    if (typeof item === 'object' && item !== null) {
                      validateObject(item);
                    } else if (typeof item === 'string') {
                      if (item.length > 200) {
                          hasError = true;
                          setErrorMsg(`An array item exceeds its character limit of 200`);
                          return;
                      }
                    }
                  })
                } else if (typeof v === 'object' && v !== null) {
                  validateObject(v);
                }
              }
            };

            validateObject(editContent);

            if (!hasError) {
              onSave(editContent);
            }
          }}
          disabled={saving || resetting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Section
        </button>

        <button
          onClick={() => {
            if (window.confirm('Reset this section to its default content? This will overwrite your current edits.')) {
              onReset();
            }
          }}
          disabled={saving || resetting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
          Reset to Default
        </button>
      </div>
    </div>
  );
}

export function ContentEditor() {
  const { content, loading, refetch } = useSiteContent();
  const { profile } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filteredSections = content.filter((s) =>
    (sectionLabels[s.section_key] ?? s.section_key).toLowerCase().includes(searchQuery.toLowerCase()),
  ).sort((a, b) => {
    const indexA = sectionOrder.indexOf(a.section_key);
    const indexB = sectionOrder.indexOf(b.section_key);
    const rankA = indexA === -1 ? 999 : indexA;
    const rankB = indexB === -1 ? 999 : indexB;
    return rankA - rankB;
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (section: SiteContent, newContent: Record<string, unknown>) => {
    if (!profile) return;
    setSaving(section.section_key);
    try {
      await updateSiteContent(
        section.section_key,
        { content: newContent },
        profile.id,
        profile.display_name ?? profile.email,
        section.content
      );
      await refetch();
      showToast(`${sectionLabels[section.section_key] ?? section.section_key} saved successfully`, 'success');
    } catch (err: any) {
      console.error('Failed to save:', err);
      showToast(`Failed to save: ${err?.message || err}`, 'error');
    }
    setSaving(null);
  };

  const handleReset = async (section: SiteContent) => {
    if (!profile) return;
    const defaults = siteDefaults[section.section_key];
    if (!defaults) {
      showToast('No default content available for this section', 'error');
      return;
    }
    setResetting(section.section_key);
    try {
      await updateSiteContent(
        section.section_key,
        { content: defaults },
        profile.id,
        profile.display_name ?? profile.email,
        section.content
      );
      await refetch();
      // Close and re-open the section to refresh the editor state
      setExpandedSection(null);
      setTimeout(() => setExpandedSection(section.section_key), 50);
      showToast(`${sectionLabels[section.section_key] ?? section.section_key} reset to default`, 'success');
    } catch (err: any) {
      console.error('Failed to reset:', err);
      showToast(`Failed to reset: ${err?.message || err}`, 'error');
    }
    setResetting(null);
  };

  const handleToggleVisibility = async (section: SiteContent) => {
    if (!profile) return;
    setTogglingVisibility(section.section_key);
    const newVisibility = !section.visible;
    const label = sectionLabels[section.section_key] ?? section.section_key;
    try {
      await updateSiteContent(
        section.section_key,
        { visible: newVisibility },
        profile.id,
        profile.display_name ?? profile.email,
      );
      await refetch();
      showToast(`${label} is now ${newVisibility ? 'visible' : 'hidden'}`, 'success');
    } catch (err: any) {
      console.error('Failed to toggle:', err);
      showToast(`Failed to toggle: ${err?.message || err}`, 'error');
    }
    setTogglingVisibility(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

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
                      onReset={() => handleReset(section)}
                      saving={saving === section.section_key}
                      resetting={resetting === section.section_key}
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
