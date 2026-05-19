import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  itemCount: number;
  onPageChange: (page: number) => void;
  hasNextPage?: boolean;
  disabled?: boolean;
};

export function PaginationControls({
  page,
  pageSize,
  itemCount,
  onPageChange,
  hasNextPage,
  disabled = false,
}: PaginationControlsProps) {
  const canGoNext = hasNextPage ?? itemCount >= pageSize;

  return (
    <div className='flex items-center justify-between gap-3 border-t px-1 pt-4 text-sm'>
      <div className='text-muted-foreground'>
        Page {page} · Showing {itemCount} item{itemCount === 1 ? '' : 's'}
      </div>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className='h-4 w-4' />
          Prev
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || !canGoNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
