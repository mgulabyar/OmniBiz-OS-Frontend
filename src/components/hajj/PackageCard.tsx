import React from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Dome,
  MapPin,
} from "lucide-react";
import type { HajjPackageItem } from "../../services/hajj/hajjService";

interface PackageCardProps {
  pkg: HajjPackageItem;
  onSelect: (pkg: HajjPackageItem) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onSelect,
}) => {
  const primaryImage = pkg.images?.[0];
  const finalPrice = pkg.discountedPrice ?? pkg.price;
  const hasDiscount =
    pkg.discountedPrice !== null && pkg.discountedPrice < pkg.price;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_16px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#173C82]/25 hover:shadow-[0_14px_30px_rgba(23,60,130,0.12)]">
      <div className="relative h-44 overflow-hidden bg-linear-to-br from-[#F4F7FC] to-[#FFF8F5]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={pkg.title.en}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Dome className="h-14 w-14 text-[#173C82]/20" />
          </div>
        )}

        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-md bg-white/95 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#173C82] shadow-sm backdrop-blur">
            {pkg.packageType}
          </span>

          <span className="rounded-md bg-[#F45A2A] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {pkg.tier}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-800">
              {pkg.title.en}
            </h3>

            <p
              dir="rtl"
              className="mt-1 text-right text-sm font-semibold text-[#173C82]/70"
            >
              {pkg.title.ar}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Per pilgrim
            </p>

            <p className="mt-1 text-lg font-bold text-[#173C82]">
              SAR {finalPrice.toFixed(2)}
            </p>

            {hasDiscount && (
              <p className="text-[11px] font-semibold text-slate-400 line-through">
                SAR {pkg.price.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {pkg.description?.en && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            {pkg.description.en}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {pkg.features.slice(0, 2).map((feature, index) => (
            <div
              key={`${feature.en}-${index}`}
              className="flex items-center gap-2 text-xs font-medium text-slate-600"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#F45A2A]" />
              <span className="truncate">{feature.en}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-[11px] font-bold text-[#173C82]">
              <CalendarDays className="h-3.5 w-3.5 text-[#F45A2A]" />
              {pkg.durationDays} days
            </span>

            {pkg.departureCity && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
                <MapPin className="h-3.5 w-3.5" />
                {pkg.departureCity}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(pkg)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] py-3 text-xs font-bold text-white shadow-[0_5px_12px_rgba(23,60,130,0.18)] transition hover:bg-[#102D63]"
          >
            Select package
            <ArrowUpRight className="h-4 w-4 text-[#F45A2A]" />
          </button>
        </div>
      </div>
    </article>
  );
};