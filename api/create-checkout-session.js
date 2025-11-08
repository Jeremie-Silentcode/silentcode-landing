import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: 'price_1SRCKm3jyROyJUIItbVGmJy9', // ton Price ID test
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/commande.html?success=true`,
      cancel_url: `${req.headers.origin}/commande.html?canceled=true`,
    });

    // On renvoie juste l'URL
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
