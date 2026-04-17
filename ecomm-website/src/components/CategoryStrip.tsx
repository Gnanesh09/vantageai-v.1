import { categories } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

export default function CategoryStrip() {
  return (
    <div className="bg-white border-b border-gray-100 py-4 shadow-sm relative w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Horizontal scroll container with hidden scrollbar */}
        <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((category) => (
            <Link 
              href={`/category/${(category as any).slug || encodeURIComponent(category.name.toLowerCase())}`}
              key={category.id} 
              className="group flex flex-col items-center gap-2 cursor-pointer min-w-[70px] md:min-w-[90px] flex-shrink-0"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-light/30 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center p-2 group-hover:bg-brand-light/60 transition-colors duration-200">
                {(category as any).image ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden">
                    <Image 
                      src={(category as any).image} 
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">
                    {(category as any).emoji}
                  </span>
                )}
              </div>
              <span className="text-[11px] md:text-sm font-semibold text-center text-gray-700 leading-tight group-hover:text-brand transition-colors">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
