import { Box, Stack, Typography } from '@mui/material';
import { Check, Circle } from 'lucide-react';
import type { CompletenessItem } from '../utils/completeness';
import type { SectionType } from '../types';

interface Props {
  score: number;
  items: CompletenessItem[];
  expanded: boolean;
  onToggle: () => void;
  onSelect: (section: SectionType | 'personal') => void;
}

export function CompletenessCard({ score, items, expanded, onToggle, onSelect }: Props) {
  const remaining = items.filter((item) => !item.done).length;
  return (
    <Box className="completeness-card">
      <button type="button" className="strength-line" onClick={onToggle} aria-expanded={expanded}>
        <Typography component="span" variant="caption" fontWeight={750}>Strength {score}%</Typography>
        <span className="strength-track" aria-hidden="true"><span style={{ width: `${score}%` }} /></span>
        <Typography component="span" variant="caption">{expanded ? 'Hide' : remaining ? `${remaining} left` : 'Done'}</Typography>
      </button>
      {expanded && (
        <Stack spacing={0.25} mt={0.75}>
          {items.map((item) => (
            <Box
              key={item.id}
              className={`completeness-row ${item.done ? 'done' : ''}`}
              onClick={() => onSelect(item.section)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(item.section); }}
              role="button"
              tabIndex={0}
            >
              {item.done ? <Check size={13} /> : <Circle size={13} />}
              <span>{item.label}</span>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
