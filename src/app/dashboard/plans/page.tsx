'use client';

import { useEffect, useState } from 'react';
import { Card, Badge, Btn, Spinner, Empty, useAsync } from '@/components/platform/ui';
import { plans as plansApi, payments as payApi } from '@/lib/core/client';
import { SITE_PLANS, type SitePlan } from '@/lib/plans';
import { Check, X, Gem, Crown, CreditCard } from 'lucide-react';

export default function PlansPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [payState, setPayState] = useState<string>('idle');
  const { data, loading, error, setData } = useAsync(
    () => plansApi.list().then((r) => ({ active: r.active })),
    [],
  );
  const active = data?.active ?? SITE_PLANS.find((p) => p.featured)?.id ?? '';

  const select = async (planId: string) => {
    setBusy(planId);
    try {
      const r = await plansApi.select(planId);
      setData({ active: r.active });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const payWithPayPal = async (plan: SitePlan) => {
    setBusy(plan.id);
    setPayState('paying');
    try {
      const r = await payApi.createOrder(plan.id, plan.price.toFixed(2));
      // Remember the pending order so capture runs on return from PayPal.
      sessionStorage.setItem('nexus_pending_paypal', JSON.stringify({ orderId: r.orderId, planId: plan.id }));
      window.location.href = r.approveLink;
      return; // redirect; page reloads after PayPal
    } catch (e) {
      alert('Could not start PayPal checkout: ' + (e as Error).message);
      setPayState('idle');
    } finally {
      if (payState !== 'paying') setBusy(null);
    }
  };

  // Handle return from PayPal (success/cancel query param).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const status = q.get('paypal');
    if (status === 'success') {
      window.setTimeout(() => setPayState('paying'), 0);
      void (async () => {
        let captured = false;
        const raw = sessionStorage.getItem('nexus_pending_paypal');
        if (raw) {
          try {
            const pending = JSON.parse(raw) as { orderId?: string; planId?: string };
            sessionStorage.removeItem('nexus_pending_paypal');
            if (pending.orderId && pending.planId) {
              await payApi.capture(pending.orderId, pending.planId);
              captured = true;
            }
          } catch (e) {
            window.setTimeout(() => alert('Payment could not be confirmed: ' + (e as Error).message), 0);
          }
        }
        // Refresh the active plan regardless (also covers a webhook-completed order).
        await plansApi.list().then((r) => setData({ active: r.active })).catch(() => null);
        setPayState(captured ? 'done' : 'idle');
        window.history.replaceState({}, '', window.location.pathname);
      })();
    } else if (status === 'cancelled') {
      window.setTimeout(() => setPayState('cancelled'), 0);
      window.setTimeout(() => setPayState('idle'), 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Plans & Billing</h1>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
          Three tiers — start free on the Core base, unlock the $1,000 premiums and the $1,600 operator stack.
          {!loading && data && (
            <Badge tone={active === 'pro' ? 'purple' : active === 'essential' ? 'amber' : 'green'}>
              Current: {SITE_PLANS.find((p) => p.id === active)?.name ?? active}
            </Badge>
          )}
        </p>
      </div>

      {payState === 'done' && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-200">
          Payment confirmed! Your plan is now active.
        </div>
      )}
      {payState === 'paying' && (
        <div className="rounded-lg border border-blue-400/30 bg-blue-400/10 p-3 text-xs text-blue-200">
          Processing PayPal payment… this may take a moment.
        </div>
      )}
      {payState === 'cancelled' && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
          PayPal checkout cancelled. You can try again.
        </div>
      )}

      {loading ? (
        <Spinner label="Loading plans..." />
      ) : error ? (
        <Empty title="Could not load plans" hint={error} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {SITE_PLANS.map((plan: SitePlan) => {
            const isActive = plan.id === active;
            return (
              <Card key={plan.id} className="flex flex-col">
                <div className="flex items-start justify-between p-4 pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold">{plan.name}</h2>
                      {plan.featured && (
                        <Badge tone="amber">
                          <Crown className="mr-1 h-3 w-3" /> Best value
                        </Badge>
                      )}
                      {isActive && <Badge tone="green">Active</Badge>}
                    </div>
                    {plan.note && <p className="mt-0.5 text-xs text-gray-500">{plan.note}</p>}
                    <p className="mt-2 text-3xl font-bold">
                      ${plan.price.toLocaleString()}
                      <span className="text-sm font-medium text-gray-500">{plan.cadence}</span>
                    </p>
                    <Badge tone="gray" >{plan.seats}</Badge>
                  </div>
                  <Gem className="h-5 w-5 text-amber-400" />
                </div>

                <p className="px-4 pt-2 text-xs text-gray-500">{plan.tagline}</p>

                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    What you get
                  </p>
                  <div className="mt-2 space-y-2">
                    {plan.features.map((f) => (
                      <p key={f} className="flex items-start gap-2 text-xs text-gray-200">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {f}
                      </p>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      <Gem className="mr-1 inline h-3 w-3" /> {plan.specials.label}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">{plan.specials.lead}</p>
                    <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {plan.specials.tools.map((t) => (
                        <p key={t} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                          <Check className="h-3 w-3 shrink-0 text-amber-400" />
                          {t}
                        </p>
                      ))}
                    </div>
                    {plan.bonus && (
                      <p className="mt-2 text-[11px] font-bold text-amber-300">{plan.bonus}</p>
                    )}
                  </div>

                  {plan.notIncluded.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Not included
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {plan.notIncluded.map((item) => (
                          <p key={item} className="flex items-center gap-2 text-xs text-gray-500">
                            <X className="h-3 w-3 shrink-0" />
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 space-y-2">
                    {isActive ? (
                      <Btn className="w-full" disabled>
                        Current plan
                      </Btn>
                    ) : (
                      <Btn
                        className="w-full"
                        onClick={() => select(plan.id)}
                        disabled={busy !== null}
                      >
                        {busy === plan.id && payState !== 'paying' ? 'Switching...' : plan.cta}
                      </Btn>
                    )}
                    {!isActive && plan.price > 0 && (
                      <Btn
                        className="w-full"
                        kind="outline"
                        onClick={() => payWithPayPal(plan)}
                        disabled={busy !== null}
                      >
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        {busy === plan.id && payState === 'paying' ? 'Opening PayPal…' : `Pay $${plan.price.toLocaleString()} with PayPal`}
                      </Btn>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}