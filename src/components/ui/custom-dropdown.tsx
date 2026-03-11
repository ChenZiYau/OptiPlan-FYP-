import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CustomDropdown({ options, value, onChange, className = '', disabled = false }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 140),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleScroll() { updatePosition(); }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full h-full min-w-max px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 outline-none cursor-pointer disabled:opacity-50 transition-colors hover:bg-white/[0.08]"
        >
          <span className="truncate mr-2">{selectedOption?.label}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width }}
              className="z-[100] rounded-xl bg-[#1C1C28] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
            >
              <ul className="py-1.5 max-h-60 overflow-y-auto outline-none">
                {options.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => {
                      if (!disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors select-none
                      ${option.value === value
                        ? 'bg-pink-500/10 text-pink-400 font-medium'
                        : 'text-gray-300 hover:bg-pink-500/10 hover:text-pink-100'
                      }
                    `}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
