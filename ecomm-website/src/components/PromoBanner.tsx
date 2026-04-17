export default function PromoBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <article className="rounded-2xl p-5 bg-primary text-white shadow-card">
        <p className="text-xs font-bold uppercase tracking-wide mb-1">Swift Deals</p>
        <h2 className="text-xl font-black mb-1">Up to 30% Off Groceries</h2>
        <p className="text-sm text-green-100">Fresh essentials delivered in 10 minutes.</p>
      </article>
      <article className="rounded-2xl p-5 bg-delivery text-white shadow-card">
        <p className="text-xs font-bold uppercase tracking-wide mb-1">Free Delivery</p>
        <h2 className="text-xl font-black mb-1">On orders above ₹199</h2>
        <p className="text-sm text-orange-100">Add daily staples and save on every basket.</p>
      </article>
    </section>
  );
}
