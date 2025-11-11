// api/create-checkout-session.js

// ⚠️ Nécessite sur Vercel :
// STRIPE_SECRET_KEY = sk_test_...

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || ""; 
// Optionnel : tu l'ajouteras sur Vercel plus tard

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res
      .status(500)
      .json({ error: 'STRIPE_SECRET_KEY manquante sur Vercel.' });
  }

  try {
    // On récupère les données envoyées par le formulaire
    const { nom, email, description, budget } = req.body || {};

    // 1️⃣ Création de la session Stripe Checkout
    const stripeRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          mode: "payment",
          "line_items[0][price]": "price_1SRCKm3jyROyJUIItbVGmJy9", // ton Price ID test
          "line_items[0][quantity]": "1",
          success_url: `${req.headers.origin}/commande.html?success=true`,
          cancel_url: `${req.headers.origin}/commande.html?canceled=true`,

          //  A) METADATA : attaché au paiement dans Stripe
          "metadata[nom]": nom || "",
          "metadata[email]": email || "",
          "metadata[description]": description || "",
          "metadata[budget]": budget || "",
        }),
      }
    );

    const sessionData = await stripeRes.json();

    if (!stripeRes.ok || !sessionData.url) {
      return res.status(400).json({
        error:
          sessionData.error?.message ||
          "Erreur lors de la création de la session Stripe.",
      });
    }

    // 2️⃣ B) Envoi optionnel vers Zapier / Google Sheets / Email
    if (ZAPIER_WEBHOOK_URL) {
      // On n'empêche pas le paiement si Zapier plante
      fetch(ZAPIER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "silentcode-commande",
          sessionId: sessionData.id,
          url: sessionData.url,
          nom: nom || "",
          email: email || "",
          description: description || "",
          budget: budget || "",
          created_at: new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    // 3️⃣ On renvoie l'URL Stripe Checkout au front
    return res.status(200).json({ url: sessionData.url });
  } catch (err) {
    console.error("ERR API:", err);
    return res
      .status(500)
      .json({ error: err.message || "Erreur serveur lors de la création." });
  }
}
