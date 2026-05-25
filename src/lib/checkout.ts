export type BillingCycle = "monthly" | "yearly";

const paymentLinks: Record<BillingCycle, string | undefined> = {
  monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PAYMENT_LINK,
  yearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PAYMENT_LINK,
};

export async function getProCheckoutUrl(billingCycle: BillingCycle): Promise<string> {
  const paymentLink = paymentLinks[billingCycle]?.trim();

  if (paymentLink) {
    return paymentLink;
  }

  throw new Error(
    "Checkout não configurado. Crie Payment Links no Stripe e adicione VITE_STRIPE_PRO_MONTHLY_PAYMENT_LINK e VITE_STRIPE_PRO_YEARLY_PAYMENT_LINK no Lovable."
  );
}
