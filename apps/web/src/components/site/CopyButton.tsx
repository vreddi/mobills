import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ActionSwapBlurButton } from '@/components/motion/action-swap-blur';
import { cn } from '@/lib/utils';

const ITEMS = [
  { id: 'copy', label: 'Copy', icon: <Copy className="h-3.5 w-3.5" />, ariaLabel: 'Copy to clipboard' },
  { id: 'copied', label: 'Copied', icon: <Check className="h-3.5 w-3.5" />, ariaLabel: 'Copied' },
];

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [value, setValue] = useState('copy');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <ActionSwapBlurButton
      items={ITEMS}
      value={value}
      size="icon"
      variant="ghost"
      className={cn('h-8 w-8 rounded-md text-muted-foreground hover:text-foreground', className)}
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setValue('copied');
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setValue('copy'), 1600);
      }}
    />
  );
}
