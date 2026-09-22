import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { Check, Circle } from 'lucide-react';
import type { CompletenessItem } from '../utils/completeness';
import type { SectionType } from '../types';

interface Props {
  score: number;
  items: CompletenessItem[];
  onSelect: (section: SectionType | 'personal') => void;
}

export function CompletenessCard({ score, items, onSelect }: Props) {
  const remaining = items.filter((item) => !item.done);
  return (
    <Box className="completeness-card">
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={0.75}>
        <Typography variant="overline" color="text.secondary">Resume strength</Typography>
        <Typography variant="caption" fontWeight={800} color={score === 100 ? 'success.main' : 'text.primary'}>{score}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={score} className="completeness-bar" />
      <Stack spacing={0.25} mt={1}>
        {(remaining.length ? remaining : items).slice(0, remaining.length ? 4 : 3).map((item) => (
          <Box
            key={item.id}
            className={`completeness-row ${item.done ? 'done' : ''}`}
            onClick={() => onSelect(item.section)}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(item.section); }}
            role="button"
            tabIndex={0}
          >
            {item.done ? <Check size={13} /> : <Circle size={13} />}
            <span>{item.done ? item.label.replace(/^Add |^Write /, '') : item.label}</span>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
