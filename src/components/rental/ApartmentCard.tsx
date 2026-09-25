import React from "react";
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Home,
  MapPin,
  UsersRound,
} from "lucide-react";
import type { ApartmentItem } from "../../services/rental/rentalService";

interface ApartmentCardProps {
  apartment: ApartmentItem;
  onSelect: (apartment: ApartmentItem) => void;
}

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const isValidHttpUrl = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const getPluralLabel = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => (count === 1 ? singular : plural);

export const ApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  onSelect,
}) => {
  const primaryImage = apartment.images?.[0];

  const title = apartment.title?.en?.trim() || "Rental Apartment";
  const titleArabic = apartment.title?.ar?.trim() || "";
  const propertyType = apartment.propertyType || "Short-Term Stay";
  const description = apartment.description?.en?.trim() || "";
  const locationName = apartment.locationName?.trim() || "";

  const roomsCount = getSafeNumber(apartment.roomsCount, 0);
  const bathroomsCount = getSafeNumber(apartment.bathroomsCount, 0);
  const maxGuests = Math.max(1, getSafeNumber(apartment.maxGuests, 1));
  const pricePerNight = getSafeNumber(apartment.pricePerNight, 0);

  const canViewMap = isValidHttpUrl(apartment.googleMapUrl);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#173C82]/20 hover:shadow-[0_10px_24px_rgba(23,60,130,0.08)]">
      <div className="relative h-48 overflow-hidden bg-linear-to-br from-[#F4F7FC] to-[#FFF8F5]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Home className="h-14 w-14 text-[#173C82]/20" />
          </div>
        )}

        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#173C82] shadow-sm backdrop-blur">
          <Home className="h-3.5 w-3.5 text-[#F45A2A]" />
          {propertyType}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[#173C82]">
              {title}
            </h3>

            {titleArabic && (
              <p
                dir="rtl"
                className="mt-1 text-right text-sm font-semibold text-[#173C82]/70"
              >
                {titleArabic}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Per Night
            </p>

            <p className="mt-1 text-lg font-bold text-[#173C82]">
              SAR {pricePerNight.toFixed(2)}
            </p>
          </div>
        </div>

        {locationName && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#F45A2A]" />
            <span className="truncate">{locationName}</span>
          </div>
        )}

        {description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
            Comfortable short-term accommodation prepared for your stay.
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#F4F7FC] px-2 py-2.5 text-center">
            <BedDouble className="mx-auto mb-1 h-3.5 w-3.5 text-[#F45A2A]" />

            <p className="text-[10px] font-bold text-[#173C82]">
              {roomsCount} {getPluralLabel(roomsCount, "room")}
            </p>
          </div>

          <div className="rounded-lg bg-[#F4F7FC] px-2 py-2.5 text-center">
            <Bath className="mx-auto mb-1 h-3.5 w-3.5 text-[#F45A2A]" />

            <p className="text-[10px] font-bold text-[#173C82]">
              {bathroomsCount} {getPluralLabel(bathroomsCount, "bath")}
            </p>
          </div>

          <div className="rounded-lg bg-[#F4F7FC] px-2 py-2.5 text-center">
            <UsersRound className="mx-auto mb-1 h-3.5 w-3.5 text-[#F45A2A]" />

            <p className="text-[10px] font-bold text-[#173C82]">
              {maxGuests} {getPluralLabel(maxGuests, "guest")}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {canViewMap ? (
              <a
                href={apartment.googleMapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-[#F45A2A]"
              >
                <MapPin className="h-3.5 w-3.5" />
                View Map
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-300">
                <MapPin className="h-3.5 w-3.5" />
                Map Unavailable
              </span>
            )}

            <button
              type="button"
              onClick={() => onSelect(apartment)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#173C82] px-3.5 text-xs font-bold text-white transition hover:bg-[#102D63] focus:outline-none focus:ring-4 focus:ring-[#173C82]/15"
            >
              Book Stay
              <ArrowUpRight className="h-3.5 w-3.5 text-[#F45A2A]" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};