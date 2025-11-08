export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vérifie qu'on a bien la clé secrète Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return res
        .status(500)
        .json({ error: 'STRIPE_SECRET_KEY manquante sur Vercel.' });
    }

    // Appel direct à l’API Stripe (pas besoin du package "stripe")
    const sessionResponse = await fetch(
      'https://api.stripe.com/v1/checkout/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          mode: 'payment',
          'line_items[0][price]': 'price_1SRCKm3jyROyJUIItbVGmJy9', // ton Price ID test
          'line_items[0][quantity]': '1',
          success_url: `${req.headers.origin}/commande.html?success=true`,
          cancel_url: `${req.headers.origin}/commande.html?canceled=true`,
        }),
      }
    );

    const sessionData = await sessionResponse.json();

    if (!sessionResponse.ok) {
      return res.status(400).json({
        error:
          sessionData.error?.message ||
          'Erreur lors de la création de la session Stripe.',
      });
    }

    // On renvoie simplement l’URL Checkout
    return res.status(200).json({ url: sessionData.url });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erreur serveur.' });
  }
}
