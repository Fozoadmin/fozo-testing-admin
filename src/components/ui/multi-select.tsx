import * as React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface MultiSelectProps {
  options: Array<{ id: number; name: string }>;
  selected: number[];
  onChange: (selected: number[]) => void;
  placeholder?: string;
  label?: string;
  onCreate?: (val: string) => void;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  label,
  onCreate,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUnselect = (id: number) => {
    onChange(selected.filter(s => s !== id));
  };

  const handleSelect = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectedOptions = options.filter(opt => selected.includes(opt.id));
  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className='relative space-y-2' ref={dropdownRef}>
      {label && <label className='text-sm font-medium'>{label}</label>}

      {/* Selected Items Display */}
      <div
        onClick={() => setOpen(!open)}
        className='border-input bg-background hover:border-ring min-h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm'
      >
        <div className='flex flex-wrap items-center gap-1'>
          {selected.length === 0 ? (
            <span className='text-muted-foreground'>{placeholder}</span>
          ) : (
            selectedOptions.map(option => (
              <Badge variant='secondary' key={option.id} className='mr-1'>
                {option.name}
                <button
                  type='button'
                  className='hover:bg-muted ml-1 rounded-full outline-none'
                  onClick={e => {
                    e.stopPropagation();
                    handleUnselect(option.id);
                  }}
                >
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ))
          )}
          <ChevronDown className='ml-auto h-4 w-4 opacity-50' />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className='bg-background border-input absolute z-50 mt-1 w-full rounded-md border shadow-lg'>
          <div className='p-2'>
            <Input
              placeholder='Search or add new...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='h-8'
              onKeyDown={e => {
                if (e.key === 'Enter' && search.trim() && filteredOptions.length === 0) {
                  e.preventDefault();
                  if (onCreate) {
                    onCreate(search.trim());
                    setSearch('');
                  }
                }
              }}
            />
          </div>
          <div className='max-h-64 overflow-auto p-1'>
            {filteredOptions.length === 0 ? (
              <div className='text-muted-foreground py-2 text-center text-sm'>
                No items found.
                {search.trim() && onCreate && (
                  <button
                    type='button'
                    className='text-primary mt-2 block w-full hover:underline'
                    onClick={() => {
                      onCreate(search.trim());
                      setSearch('');
                    }}
                  >
                    Create "{search.trim()}"
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`hover:bg-accent flex cursor-pointer items-center rounded px-2 py-1.5 text-sm ${
                    selected.includes(option.id) ? 'bg-accent' : ''
                  }`}
                >
                  <div
                    className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                      selected.includes(option.id) ? 'bg-primary border-primary' : 'border-input'
                    }`}
                  >
                    {selected.includes(option.id) && (
                      <svg
                        className='text-primary-foreground h-3 w-3'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <polyline points='20 6 9 17 4 12' />
                      </svg>
                    )}
                  </div>
                  {option.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <p className='text-muted-foreground text-xs'>
          {selected.length} item{selected.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
