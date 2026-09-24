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

export const ApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  onSelect,
}) => {
  const primaryImage = apartment.images?.[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_16px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#173C82]/25 hover:shadow-[0_14px_30px_rgba(23,60,130,0.12)]">
      <div className="relative h-48 overflow-hidden bg-linear-to-br from-[#F4F7FC] to-[#FFF8F5]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={apartment.title.en}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Home className="h-14 w-14 text-[#173C82]/20" />
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-md bg-white/95 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#173C82] shadow-sm backdrop-blur">
          {apartment.propertyType}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-800">
              {apartment.title.en}
            </h3>

            <p
              dir="rtl"
              className="mt-1 text-right text-sm font-semibold text-[#173C82]/70"
            >
              {apartment.title.ar}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Per night
            </p>

            <p className="mt-1 text-lg font-bold text-[#173C82]">
              SAR {apartment.pricePerNight.toFixed(2)}
            </p>
          </div>
        </div>

        {apartment.locationName && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-[#F45A2A]" />
            <span className="truncate">{apartment.locationName}</span>
          </div>
        )}

        {apartment.description?.en && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
            {apartment.description.en}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <span className="rounded-lg bg-[#F4F7FC] px-2 py-2 text-center text-[10px] font-bold text-[#173C82]">
            <BedDouble className="mx-auto mb-1 h-3.5 w-3.5 text-[#F45A2A]" />
            {apartment.roomsCount} rooms
          </span>

          <span className="rounded-lg bg-[#F4F7FC] px-2 py-2 text-center text-[10px] font-bold text-[#173C82]">
            <Bath className="mx-auto mb-1 h-3.5 w-3.5 text-[#F45A2A]" />
            {apartment.bathroomsCount} bath
          </span>

          <span className="rounded-lg bg-[#F4F7FC] px-2 py-2 text-center text-[10px] font-bold text-[#173C82]">
            <UsersRound className="mx-auto mb-1 h-3.5 w-3.5 text-[#F45A2A]" />
            {apartment.maxGuests} guests
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <a
              href={apartment.googleMapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-[#F45A2A]"
            >
              <MapPin className="h-3.5 w-3.5" />
              View map
            </a>

            <button
              type="button"
              onClick={() => onSelect(apartment)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#173C82] px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_5px_12px_rgba(23,60,130,0.18)] transition hover:bg-[#102D63]"
            >
              Book stay
              <ArrowUpRight className="h-3.5 w-3.5 text-[#F45A2A]" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};