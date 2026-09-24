import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../services/api';
import { listPlans, type SubscriptionPlan } from '../services/billingApi';
import { startPlanCheckout } from '../lib/razorpayCheckout';
import '../billing.css';

function formatMoney(cents: number, currency = 'INR') {
  if (cents <= 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
  } catch {
    return `${currency} ${Math.round(cents / 100)}`;
  }
}

interface Props {
  open: boolean;
  reason: 'pdf' | 'ai' | 'template';
  onClose: () => void;
}

export function PaywallDialog({ open, reason, onClose }: Props) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutSlug, setCheckoutSlug] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setLoading(true);
    listPlans()
      .then((next) => setPlans(next.filter((plan) => plan.priceCents > 0)))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load plans'))
      .finally(() => setLoading(false));
  }, [open]);

  const subscribe = async (plan: SubscriptionPlan) => {
    setCheckoutSlug(plan.slug);
    setError('');
    try {
      await startPlanCheckout(plan);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : 'Checkout failed');
    } finally {
      setCheckoutSlug('');
    }
  };

  const title = reason === 'pdf' ? 'Subscribe to export PDF' : reason === 'template' ? 'Subscribe for Pro templates' : 'Subscribe to use AI';
  const blurb = reason === 'pdf'
    ? 'PDF download unlocks on Starter and Pro. Subscribe with Razorpay, then export in one click.'
    : reason === 'template'
      ? 'Seven layouts stay free. Editorial, Folio, Lumen, Chronicle, Velvet, and the other gold-framed layouts unlock on Starter and Pro.'
      : 'The AI assistant unlocks on Starter and Pro. Subscribe with Razorpay, then generate suggestions.';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center"><Sparkles size={18} />{title}</Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>{blurb}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {loading ? <Box textAlign="center" py={4}><CircularProgress color="inherit" /></Box> : (
          <Stack spacing={1.5}>
            {plans.map((plan) => (
              <Box key={plan.id} className={`paywall-plan ${plan.metadata?.popular ? 'popular' : ''}`}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                  <Typography fontWeight={800}>{plan.name}</Typography>
                  <Typography fontWeight={750}>
                    {formatMoney(plan.priceCents, plan.currency)}
                    {plan.priceCents > 0 && <Typography component="span" color="text.secondary" fontWeight={500}>/{plan.billingCycle === 'yearly' ? 'yr' : 'mo'}</Typography>}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mt={0.5}>{plan.description}</Typography>
                <Stack spacing={0.4} mt={1} mb={1.5}>
                  {(Array.isArray(plan.features) ? plan.features.map(String) : []).map((feature) => (
                    <Stack direction="row" spacing={1} key={feature} alignItems="flex-start">
                      <Check size={14} color="#255c4b" />
                      <Typography variant="body2">{feature}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Button
                  fullWidth
                  variant={plan.metadata?.popular ? 'contained' : 'outlined'}
                  disabled={Boolean(checkoutSlug) || plan.checkoutAvailable === false}
                  onClick={() => subscribe(plan)}
                >
                  {checkoutSlug === plan.slug ? 'Redirecting to Razorpay…' : `Subscribe to ${plan.name}`}
                </Button>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Not now</Button>
        <Button onClick={() => { onClose(); navigate('/billing'); }}>View all plans</Button>
      </DialogActions>
    </Dialog>
  );
}
