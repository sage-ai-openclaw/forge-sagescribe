import express from 'express';
import Stripe from 'stripe';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create Stripe customer if not exists
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/settings?success=true`,
      cancel_url: `${req.headers.origin}/settings?canceled=true`,
      metadata: {
        userId: userId.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create portal session for managing subscription
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    if (!user?.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${req.headers.origin}/settings`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Webhook handler
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          db.prepare(`
            UPDATE users 
            SET tier = 'pro',
                stripe_subscription_id = ?,
                subscription_status = ?,
                current_period_end = ?
            WHERE id = ?
          `).run(
            subscription.id,
            subscription.status,
            subscription.current_period_end,
            userId
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(invoice.customer as string);
          
          if ('metadata' in customer && customer.metadata?.userId) {
            db.prepare(`
              UPDATE users 
              SET subscription_status = ?,
                  current_period_end = ?
              WHERE id = ?
            `).run(
              subscription.status,
              subscription.current_period_end,
              customer.metadata.userId
            );
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('metadata' in customer && customer.metadata?.userId) {
          const status = subscription.status;
          const tier = status === 'active' || status === 'trialing' ? 'pro' : 'free';
          
          db.prepare(`
            UPDATE users 
            SET tier = ?,
                subscription_status = ?,
                current_period_end = ?
            WHERE id = ?
          `).run(
            tier,
            status,
            subscription.current_period_end,
            customer.metadata.userId
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('metadata' in customer && customer.metadata?.userId) {
          db.prepare(`
            UPDATE users 
            SET tier = 'free',
                subscription_status = 'canceled',
                stripe_subscription_id = NULL
            WHERE id = ?
          `).run(customer.metadata.userId);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get subscription status
router.get('/subscription', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = db.prepare(`
      SELECT tier, subscription_status, current_period_end, stripe_subscription_id
      FROM users WHERE id = ?
    `).get(userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      tier: user.tier,
      status: user.subscription_status,
      currentPeriodEnd: user.current_period_end ? new Date(user.current_period_end * 1000).toISOString() : null,
      hasSubscription: !!user.stripe_subscription_id,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

export default router;
