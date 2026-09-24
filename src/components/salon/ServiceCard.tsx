import React from "react";
import { ArrowUpRight, Clock3, Scissors } from "lucide-react";
import type { SalonServiceItem } from "../../services/salon/salonService";

interface ServiceCardProps {
  service: SalonServiceItem;
  onSelect: (service: SalonServiceItem) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onSelect,
}) => {
  const finalPrice = service.discountedPrice ?? service.price;
  const hasDiscount =
    service.discountedPrice !== null &&
    service.discountedPrice < service.price;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#173C82]/25 hover:shadow-[0_14px_30px_rgba(23,60,130,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-[11px] font-bold text-[#173C82]">
          <Scissors className="h-3.5 w-3.5 text-[#F45A2A]" />
          <span>{service.category}</span>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Starting at
          </p>

          <div className="mt-1 flex items-baseline justify-end gap-1.5">
            <span className="text-md font-bold text-[#173C82]">
              SAR {finalPrice.toFixed(2)}
            </span>

            {hasDiscount && (
              <span className="text-[11px] font-semibold text-slate-400 line-through">
                {service.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-base font-bold leading-6 text-slate-800">
          {service.name.en}
        </h3>

        <p
          dir="rtl"
          className="mt-1 text-right text-sm font-medium text-[#173C82]/75"
        >
          {service.name.ar}
        </p>

        {service.description?.en && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
            {service.description.en}
          </p>
        )}
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Clock3 className="h-4 w-4 text-[#F45A2A]" />
            <span>{service.durationMinutes} minutes</span>
          </div>

          <button
            type="button"
            onClick={() => onSelect(service)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#173C82] px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_5px_12px_rgba(23,60,130,0.18)] transition hover:bg-[#102D63] focus:outline-none focus:ring-4 focus:ring-[#173C82]/15"
          >
            <span>Book now</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#F45A2A]" />
          </button>
        </div>
      </div>
    </article>
  );
};