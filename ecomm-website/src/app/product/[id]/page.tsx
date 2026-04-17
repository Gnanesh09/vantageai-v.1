import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Shield,
  RotateCcw,
  Truck,
  Share2,
  Heart,
  CheckCircle2,
  Star,
  BadgePercent,
} from "lucide-react";
import ProductActions from "@/components/ProductActions";
import ProductReviews from "@/components/ProductReviews";
import StarRating from "@/components/StarRating";
import SafeImage from "@/components/SafeImage";
import { getInsights, getProductRatings } from "@/lib/api";
import { fetchSwiftCartProducts } from "@/lib/data";

const BRAND_ID = process.env.NEXT_PUBLIC_BRAND_ID || "";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [products, ratings, insights] = await Promise.all([
    fetchSwiftCartProducts(BRAND_ID),
    getProductRatings(),
    getInsights(id, 20, 0),
  ]);

  const productBase = products.find((p) => p.id === id);
  if (!productBase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-lg shadow-purple-100/50">
            <span className="text-3xl">🔍</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2 tracking-tight">
            Product Not Found
          </h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Sorry, the product you&apos;re looking for doesn&apos;t exist or has
            been removed from our catalog.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#8025E2] to-[#6B1FC8] text-white text-sm font-bold rounded-2xl hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const ratingInfo = ratings[productBase.id] || {
    rating: 0,
    reviewCount: 0,
  };
  const product = {
    ...productBase,
    rating: ratingInfo.rating,
    reviewCount: ratingInfo.reviewCount,
  };

  const total = insights.insights.length;
  const positives = insights.insights.filter(
    (r) => r.overall_sentiment === "positive"
  ).length;
  const positivePct = total > 0 ? (positives / total) * 100 : 0;
  const avgRating =
    total > 0
      ? insights.insights.reduce((sum, r) => sum + (r.star_rating || 0), 0) /
        total
      : product.rating || 0;

  const discount =
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#F4F1FB]">
      {/* ═══════════ STICKY MOBILE HEADER ═══════════ */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-2xl border-b border-purple-100/60 md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-90 transition-all duration-200"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-[#8025E2]" />
          </Link>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Product Details
          </span>
          <div className="flex items-center gap-1.5">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-90 transition-all duration-200">
              <Share2 className="w-[16px] h-[16px] text-[#8025E2]" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-90 transition-all duration-200">
              <Heart className="w-[16px] h-[16px] text-[#8025E2]" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════ DESKTOP TOP NAV ═══════════ */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 lg:px-10 pt-8 pb-2">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 text-sm font-semibold text-gray-500 hover:text-[#8025E2] transition-colors duration-200"
          >
            <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm border border-purple-100/50 group-hover:shadow-md group-hover:border-purple-200 group-hover:-translate-x-0.5 transition-all duration-300">
              <ArrowLeft className="w-4 h-4 text-[#8025E2]" />
            </span>
            Back to products
          </Link>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 active:scale-95 transition-all duration-200">
              <Share2 className="w-4 h-4 text-gray-500" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-pink-200 active:scale-95 transition-all duration-200 group">
              <Heart className="w-4 h-4 text-gray-500 group-hover:text-pink-500 transition-colors" />
            </button>
          </div>
        </nav>
      </div>

      {/* ═══════════ MAIN GRID ═══════════ */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 xl:gap-16">
          {/* ─────── IMAGE COLUMN ─────── */}
          <section className="lg:col-span-5">
            <div className="lg:sticky lg:top-10">
              {/* Main Image Card */}
              <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_4px_60px_-15px_rgba(128,37,226,0.10)] border border-purple-50/80 group">
                {/* Discount Ribbon */}
                {discount > 0 && (
                  <div className="absolute top-4 left-4 z-20 animate-[fadeInDown_0.4s_ease-out]">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-[#FF2D55] to-[#FF6544] text-white text-[11px] font-extrabold tracking-wide px-3 py-1.5 rounded-xl shadow-lg shadow-red-500/30">
                      <BadgePercent className="w-3.5 h-3.5" />
                      {discount}% OFF
                    </div>
                  </div>
                )}

                {/* Delivery Badge on Image */}
                <div className="absolute bottom-4 left-4 z-20">
                  <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg border border-white/50">
                    <Zap className="w-3.5 h-3.5 text-[#8025E2] fill-[#8025E2]" />
                    <span className="text-gray-800">10 min delivery</span>
                  </div>
                </div>

                {/* Image Container */}
                <div className="aspect-square bg-gradient-to-br from-purple-50/60 via-white to-fuchsia-50/40 flex items-center justify-center p-8 md:p-14 overflow-hidden">
                  <SafeImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(128,37,226,0.10)] group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  />
                </div>
              </div>

              {/* Trust Badges — Desktop Only */}
              <div className="hidden lg:grid grid-cols-3 gap-3 mt-5">
                {[
                  {
                    icon: Shield,
                    title: "100% Genuine",
                    sub: "Authentic products",
                    color: "text-emerald-600",
                    bg: "from-emerald-50 to-green-50",
                    border: "border-emerald-100",
                  },
                  {
                    icon: RotateCcw,
                    title: "Easy Returns",
                    sub: "7-day return policy",
                    color: "text-blue-600",
                    bg: "from-blue-50 to-sky-50",
                    border: "border-blue-100",
                  },
                  {
                    icon: Truck,
                    title: "Free Delivery",
                    sub: "On orders ₹99+",
                    color: "text-[#8025E2]",
                    bg: "from-purple-50 to-fuchsia-50",
                    border: "border-purple-100",
                  },
                ].map(({ icon: Icon, title, sub, color, bg, border }) => (
                  <div
                    key={title}
                    className={`bg-gradient-to-br ${bg} ${border} border rounded-2xl p-3.5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
                    <p className="text-[11px] font-bold text-gray-800 leading-tight">
                      {title}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─────── DETAILS COLUMN ─────── */}
          <section className="lg:col-span-7">
            {/* Category Badge */}
            <div className="mb-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-fuchsia-100 text-[#8025E2] border border-purple-200/50">
                <CheckCircle2 className="w-3 h-3" />
                {product.category}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold text-gray-900 leading-tight tracking-tight mb-1.5">
              {product.name}
            </h1>

            {/* Weight / Variant */}
            <p className="text-sm font-medium text-gray-400 mb-5">
              {product.weight}
            </p>

            {/* Rating Row */}
            <div className="flex items-center flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="text-sm font-extrabold text-gray-800">
                  {product.rating?.toFixed(1) || "0.0"}
                </span>
              </div>
              <StarRating
                rating={product.rating}
                count={product.reviewCount}
                size="md"
              />
              {product.reviewCount > 0 && (
                <span className="text-xs text-gray-400 font-medium">
                  ({product.reviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>

            {/* ═══ PRICE CARD ═══ */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_30px_-10px_rgba(128,37,226,0.08)] border border-purple-50/80 mb-5">
              <div className="flex items-end gap-3 mb-3">
                <span className="text-[2.5rem] leading-none font-black text-gray-900 tracking-tight">
                  ₹{product.price}
                </span>
                {product.originalPrice > product.price && (
                  <div className="flex flex-col mb-1">
                    <span className="text-sm text-gray-400 line-through decoration-red-400 decoration-2">
                      ₹{product.originalPrice}
                    </span>
                  </div>
                )}
                {discount > 0 && (
                  <span className="mb-1.5 text-[13px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/50">
                    You save ₹{product.originalPrice - product.price}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8025E2] to-[#6B1FC8] text-white shadow-lg shadow-purple-500/20">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Delivery in 10 mins
                </span>
                <span className="text-[11px] font-medium text-gray-400">
                  Inclusive of all taxes
                </span>
              </div>
            </div>

            {/* ═══ ADD TO CART / ACTIONS ═══ */}
            <div className="mb-6">
              <ProductActions product={product} />
            </div>

            {/* ═══ TRUST BADGES — Mobile Only ═══ */}
            <div className="grid grid-cols-3 gap-2.5 mb-6 lg:hidden">
              {[
                {
                  icon: Shield,
                  title: "Genuine",
                  sub: "100% authentic",
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  icon: RotateCcw,
                  title: "Returns",
                  sub: "7-day easy",
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  icon: Truck,
                  title: "Free Ship",
                  sub: "On ₹99+",
                  color: "text-[#8025E2]",
                  bg: "bg-purple-50",
                },
              ].map(({ icon: Icon, title, sub, color, bg }) => (
                <div
                  key={title}
                  className={`${bg} rounded-2xl p-3 text-center border border-white`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                  <p className="text-[11px] font-bold text-gray-700">
                    {title}
                  </p>
                  <p className="text-[9px] text-gray-500">{sub}</p>
                </div>
              ))}
            </div>

            {/* ═══ HIGHLIGHTS ═══ */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_30px_-10px_rgba(128,37,226,0.06)] border border-purple-50/80 mb-6">
              <h3 className="text-sm font-extrabold text-gray-800 mb-3 tracking-tight flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-[#8025E2] to-[#C84FFF] rounded-full" />
                Product Highlights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  "Premium quality guaranteed",
                  "Farm fresh & natural",
                  "No artificial preservatives",
                  "Hygienically packed",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[13px] text-gray-600"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ REVIEWS SECTION ═══ */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_30px_-10px_rgba(128,37,226,0.06)] border border-purple-50/80">
              <h3 className="text-sm font-extrabold text-gray-800 mb-4 tracking-tight flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                Ratings & Reviews
              </h3>
              <ProductReviews
                productId={product.id}
                total={product.reviewCount || total}
                positivePct={positivePct}
                avgRating={avgRating}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}