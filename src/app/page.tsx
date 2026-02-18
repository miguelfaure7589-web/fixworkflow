import LandingPage from "@/components/LandingPage";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FixWorkFlow",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Get your free Revenue Health Score. See which of 5 business pillars is costing you money and follow a personalized playbook to fix it in 30 days.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "127",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
