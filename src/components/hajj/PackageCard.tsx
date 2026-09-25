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

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onSelect,
}) => {
  const primaryImage = pkg.images?.[0];
  const packageTitle = pkg.title?.en?.trim() || "Hajj & Umrah Package";
  const packageTitleArabic = pkg.title?.ar?.trim() || "";
  const packageDescription = pkg.description?.en?.trim() || "";

  const regularPrice = getSafeNumber(pkg.price, 0);

  const discountedPrice =
    pkg.discountedPrice !== null && pkg.discountedPrice !== undefined
      ? getSafeNumber(pkg.discountedPrice, regularPrice)
      : null;

  const hasDiscount =
    discountedPrice !== null &&
    discountedPrice >= 0 &&
    discountedPrice < regularPrice;

  const finalPrice = hasDiscount ? discountedPrice : regularPrice;

  const durationDays = getSafeNumber(pkg.durationDays, 0);

  const features = (pkg.features ?? []).filter(
    (feature) => Boolean(feature?.en?.trim()),
  );

  const visibleFeatures = features.slice(0, 2);
  const remainingFeatureCount = features.length - visibleFeatures.length;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#173C82]/20 hover:shadow-[0_10px_24px_rgba(23,60,130,0.08)]">
      <div className="relative h-44 overflow-hidden bg-linear-to-br from-[#F4F7FC] to-[#FFF8F5]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={packageTitle}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Dome className="h-14 w-14 text-[#173C82]/20" />
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#173C82] shadow-sm backdrop-blur">
            <Dome className="h-3.5 w-3.5 text-[#F45A2A]" />
            {pkg.packageType || "Hajj & Umrah"}
          </span>

          <span className="rounded-md bg-[#F45A2A] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {pkg.tier || "Package"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[#173C82]">
              {packageTitle}
            </h3>

            {packageTitleArabic && (
              <p
                dir="rtl"
                className="mt-1 text-right text-sm font-semibold text-[#173C82]/70"
              >
                {packageTitleArabic}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Per Pilgrim
            </p>

            <p className="mt-1 text-md font-bold text-[#173C82]">
              SAR {finalPrice.toFixed(2)}
            </p>

            {hasDiscount && (
              <p className="text-[11px] font-semibold text-slate-400 line-through">
                SAR {regularPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {packageDescription ? (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            {packageDescription}
          </p>
        ) : (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">
            A carefully prepared Hajj and Umrah journey with dedicated travel
            support.
          </p>
        )}

        <div className="mt-4 space-y-2">
          {visibleFeatures.length > 0 ? (
            <>
              {visibleFeatures.map((feature, index) => (
                <div
                  key={`${feature.en}-${index}`}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#F45A2A]" />
                  <span className="truncate">{feature.en}</span>
                </div>
              ))}

              {remainingFeatureCount > 0 && (
                <p className="pl-5.5 text-[11px] font-bold text-slate-400">
                  +{remainingFeatureCount} more feature
                  {remainingFeatureCount !== 1 ? "s" : ""}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#173C82]/35" />
              Package inclusions available on inquiry
            </div>
          )}
        </div>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-[11px] font-bold text-[#173C82]">
              <CalendarDays className="h-3.5 w-3.5 text-[#F45A2A]" />
              {durationDays > 0 ? `${durationDays} days` : "Duration on request"}
            </span>

            {pkg.departureCity?.trim() && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-[#173C82]" />
                {pkg.departureCity.trim()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(pkg)}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-4 text-xs font-bold text-white transition hover:bg-[#102D63] focus:outline-none focus:ring-4 focus:ring-[#173C82]/15"
          >
            Select Package
            <ArrowUpRight className="h-4 w-4 text-[#F45A2A]" />
          </button>
        </div>
      </div>
    </article>
  );
};