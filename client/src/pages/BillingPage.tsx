import { useEffect, useMemo, useState } from 'react';
import {
  Alert, AppBar, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, IconButton, Menu, MenuItem, Stack, Toolbar, Typography
} from '@mui/material';
import { Check, ChevronDown, CreditCard, LogOut, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../services/api';
import {
  cancelSubscription, confirmSubscription, createSubscription, getSubscriptionStatus, listPlans,
  type SubscriptionPlan, type UserSubscription
} from '../services/billingApi';
import { openRazorpaySubscriptionCheckout, razorpayCallbackUrl } from '../lib/razorpayCheckout';
import '../dashboard.css';
import '../billing.css';

const SUPPORT_EMAIL = 'support@datacaptain.in';

function formatMoney(cents: number, currency = 'INR') {
  if (cents < 0) return 'Custom';
  if (cents === 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
  } catch {
    return `${currency} ${Math.round(cents / 100)}`;
  }
}

function featureList(plan: SubscriptionPlan) {
  return Array.isArray(plan.features) ? plan.features.map(String) : [];
}

export default function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const refresh = async () => {
    const [nextPlans, nextSub] = await Promise.all([listPlans(), getSubscriptionStatus()]);
    setPlans(nextPlans);
    setSubscription(nextSub);
  };

  useEffect(() => {
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load billing')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const subscriptionId = searchParams.get('razorpay_subscription_id');
    const paymentId = searchParams.get('razorpay_payment_id');
    if (!subscriptionId && !paymentId) return;
    let cancelled = false;
    (async () => {
      try {
        if (subscriptionId) await confirmSubscription(subscriptionId);
        if (!cancelled) {
          await Promise.all([refresh(), loadCurrentUser()]);
          setPaymentSuccess(true);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not confirm payment');
      } finally {
        if (!cancelled) window.history.replaceState({}, '', '/billing');
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams, loadCurrentUser]);

  const isActive = subscription?.status === 'ACTIVE';
  const popularSlug = useMemo(() => plans.find((plan) => plan.metadata?.popular)?.slug ?? 'starter', [plans]);

  const startCheckout = async () => {
    if (!selected?.slug) return;
    setCheckoutLoading(true);
    setError('');
    try {
      const data = await createSubscription(selected.slug);
      setSelected(null);
      if (data.razorpayKeyId && data.subscriptionId) {
        await openRazorpaySubscriptionCheckout({
          key: data.razorpayKeyId,
          subscriptionId: data.subscriptionId,
          name: 'ResumeForge',
          description: selected.name,
          callbackUrl: razorpayCallbackUrl()
        });
      } else {
        window.location.href = data.checkoutUrl;
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const onCancel = async () => {
    if (!subscription?.externalId) return;
    if (!window.confirm("Cancel your subscription? You'll keep access until the end of the billing period.")) return;
    setCancelling(true);
    try {
      await cancelSubscription(subscription.externalId);
      await Promise.all([refresh(), loadCurrentUser()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to cancel');
    } finally {
      setCancelling(false);
    }
  };

  return <Box className="dashboard-page" sx={{ minHeight: '100vh', bgcolor: '#F7F7F5', color: '#202124' }}>
    <AppBar position="static" elevation={0} className="dashboard-topbar" sx={{ bgcolor: '#fff', color: '#202124', borderBottom: '1px solid #e5e9e6' }}>
      <Toolbar sx={{ maxWidth: 1180, width: '100%', mx: 'auto' }}>
        <Box className="brand-mark"><Box className="brand-badge"><Sparkles size={16} fill="currentColor" /></Box><Typography component="span" fontWeight={800} letterSpacing="-0.5px" sx={{ display: { xs: 'none', sm: 'inline' } }}>ResumeForge</Typography></Box>
        <Box flex={1} />
        <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>My Resumes</Button>
        <Box className="user-chip" onClick={(event) => setUserMenuAnchor(event.currentTarget)}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: '#255c4b' }}>{(user?.name || 'U').slice(0, 1).toUpperCase()}</Avatar>
          <Typography variant="body2" fontWeight={650} sx={{ display: { xs: 'none', sm: 'inline' } }} noWrap maxWidth={140}>{user?.name}</Typography>
          <ChevronDown size={15} />
        </Box>
        <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <Box px={2} py={1.25} sx={{ borderBottom: '1px solid #eef1ee' }}><Typography variant="body2" fontWeight={700} noWrap>{user?.name}</Typography><Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography></Box>
          <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/billing'); }}><CreditCard size={15} />&nbsp; Billing</MenuItem>
          <MenuItem onClick={() => { logout(); navigate('/login'); }} sx={{ color: 'error.main', gap: 1 }}><LogOut size={15} /> Sign out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>

    <Box className="dashboard-content" maxWidth={1180} mx="auto" px={{ xs: 2, sm: 3 }} py={{ xs: 3, sm: 6 }}>
      <Box className="dashboard-heading" mb={3}>
        <Typography variant="overline" color="#255c4b" fontWeight={800}>Billing</Typography>
        <Typography variant="h3" fontWeight={750} letterSpacing="-1.5px">Plans & billing</Typography>
        <Typography color="#626871">Same Razorpay checkout as DataCaptain. Invoices go to your account email.</Typography>
      </Box>

      {paymentSuccess && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setPaymentSuccess(false)}>Payment successful. Your subscription is being activated. Razorpay will email a receipt{user?.email ? ` to ${user.email}` : ''}.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" className="billing-status-card">
            <CardContent>
              <Typography variant="overline" color="text.secondary">Current plan</Typography>
              {isActive && subscription ? (
                <>
                  <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                    <Typography variant="h5" fontWeight={750}>{subscription.plan.name}</Typography>
                    <Chip size="small" color="success" label="Active" />
                  </Stack>
                  <Typography color="text.secondary" mt={1}>Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Typography>
                  <Button color="error" variant="outlined" sx={{ mt: 2 }} disabled={cancelling} onClick={onCancel}>{cancelling ? 'Cancelling…' : 'Cancel subscription'}</Button>
                </>
              ) : (
                <>
                  <Typography variant="h5" fontWeight={750} mt={1}>Free tier</Typography>
                  <Typography color="text.secondary" mt={1}>Upgrade below to unlock the AI assistant.</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" className="billing-status-card">
            <CardContent>
              <Typography variant="overline" color="text.secondary">Secure payments</Typography>
              <Typography variant="h6" fontWeight={750} mt={1}>Razorpay checkout</Typography>
              <Typography color="text.secondary" mt={1}>We never store your card details. Questions? <a href={`mailto:${SUPPORT_EMAIL}?subject=Billing%20help`}>{SUPPORT_EMAIL}</a></Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? <Box textAlign="center" py={8}><CircularProgress color="inherit" /></Box> : (
        <Grid container spacing={2.5}>
          {plans.map((plan) => {
            const current = isActive && subscription?.plan.slug === plan.slug;
            return <Grid item xs={12} sm={6} key={plan.id}>
              <Card variant="outlined" className={`billing-plan-card ${plan.slug === popularSlug ? 'popular' : ''}`}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={800}>{plan.name}</Typography>
                    {plan.metadata?.offerBadge && <Chip size="small" label={plan.metadata.offerBadge} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mt={0.75} minHeight={40}>{plan.description}</Typography>
                  <Stack direction="row" alignItems="baseline" spacing={1} mt={2}>
                    <Typography variant="h4" fontWeight={800}>{formatMoney(plan.priceCents, plan.currency)}</Typography>
                    {plan.priceCents > 0 && <Typography color="text.secondary">/{plan.billingCycle === 'yearly' ? 'year' : 'mo'}</Typography>}
                  </Stack>
                  <Stack spacing={0.75} mt={2} mb={2}>
                    {featureList(plan).map((feature) => <Stack direction="row" spacing={1} key={feature} alignItems="flex-start">
                      <Check size={15} color="#255c4b" /><Typography variant="body2">{feature}</Typography>
                    </Stack>)}
                  </Stack>
                  {current ? <Button fullWidth disabled>Current plan</Button> : plan.priceCents <= 0 ? <Button fullWidth variant="outlined" onClick={() => navigate('/dashboard')}>Continue for free</Button> : (
                    <Button fullWidth variant="contained" disabled={plan.checkoutAvailable === false} onClick={() => { if (plan.checkoutAvailable === false) { window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Enable%20billing%20for%20${plan.slug}`; return; } setSelected(plan); }}>{plan.checkoutAvailable === false ? 'Contact to enable' : 'Subscribe'}</Button>
                  )}
                </CardContent>
              </Card>
            </Grid>;
          })}
        </Grid>
      )}
      <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={4}>Payments processed securely by Razorpay · {SUPPORT_EMAIL}</Typography>
    </Box>

    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="xs">
      <DialogTitle>Complete payment</DialogTitle>
      <DialogContent>
        {selected && <>
          <Box className="billing-checkout-summary">
            <Typography fontWeight={750}>{selected.name}</Typography>
            <Typography variant="body2" color="text.secondary">{formatMoney(selected.priceCents, selected.currency)}/{selected.billingCycle === 'yearly' ? 'year' : 'mo'}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">You'll complete checkout on Razorpay. We never store your card details.</Typography>
        </>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSelected(null)}>Cancel</Button>
        <Button variant="contained" onClick={startCheckout} disabled={checkoutLoading}>{checkoutLoading ? 'Redirecting to Razorpay…' : 'Proceed to payment'}</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
