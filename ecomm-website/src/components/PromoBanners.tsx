import { promotions } from "@/lib/data";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export default function PromoBanners() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {promotions.map((promo) => (
          <div 
            key={promo.id}
            className={`relative overflow-hidden rounded-3xl h-[220px] md:h-[260px] bg-gradient-to-r ${promo.bgGradient} flex cursor-pointer shadow-sm hover:shadow-md transition-shadow`}
          >
            {/* Background Image Optional Override Layer */}
            <div className="absolute inset-0 z-0 opacity-40 md:opacity-50">
              <Image 
                src={promo.image} 
                alt={promo.title}
                fill
                className="object-cover"
              />
            </div>
            
            {/* Content Container */}
            <div className="relative z-10 flex flex-col justify-between p-6 md:p-8 w-full md:w-2/3">
              <div>
                {promo.id === 1 && (
                  <span className={`text-[10px] md:text-sm font-extrabold uppercase tracking-wider mb-2 block ${promo.textColor}`}>
                    ALL NEW SWIFTCART EXPERIENCE
                  </span>
                )}
                <h2 className={`text-4xl md:text-5xl font-black ${promo.textColor} leading-tight mb-1`}>
                  {promo.title}
                </h2>
                <p className={`text-sm md:text-base font-semibold ${promo.textColor} bg-white/40 backdrop-blur-sm inline-block px-3 py-1 rounded-lg mt-2`}>
                  {promo.subtitle}
                </p>
              </div>

              {/* Features or Action Button */}
              {promo.features ? (
                <div className="flex flex-wrap gap-2 md:gap-3 mt-4">
                  {promo.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-800">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <button className={`${promo.pillColor} px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform`}>
                    {promo.buttonText}
                  </button>
                </div>
              )}
            </div>
            
          </div>
        ))}

      </div>
    </div>
  );
}
