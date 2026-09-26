import React from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CarFront,
  Snowflake,
  UsersRound,
} from "lucide-react";
import type { VehicleItem } from "../../services/transport/transportService";

interface VehicleCardProps {
  vehicle: VehicleItem;
  onInquire: (vehicle: VehicleItem) => void;
}

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const getPluralLabel = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => (count === 1 ? singular : plural);

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onInquire,
}) => {
  const primaryImage = vehicle.images?.[0];

  const vehicleName = vehicle.name?.en?.trim() || "Transport Vehicle";
  const vehicleNameArabic = vehicle.name?.ar?.trim() || "";
  const vehicleDescription = vehicle.description?.en?.trim() || "";

  const dailyRate = getSafeNumber(vehicle.pricePerDay, 0);
  const passengerCapacity = Math.max(1, getSafeNumber(vehicle.capacity, 1));
  const luggageCapacity = Math.max(
    0,
    getSafeNumber(vehicle.luggageCapacity, 0),
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#173C82]/20 hover:shadow-[0_10px_24px_rgba(23,60,130,0.08)]">
      <div className="relative h-44 overflow-hidden bg-linear-to-br from-[#F4F7FC] to-[#FFF8F5]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={vehicleName}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CarFront className="h-14 w-14 text-[#173C82]/20" />
          </div>
        )}

        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-[#173C82] shadow-sm backdrop-blur">
          <CarFront className="h-3.5 w-3.5 text-[#F45A2A]" />
          {vehicle.vehicleType || "Transport"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[#173C82]">
              {vehicleName}
            </h3>

            {vehicleNameArabic && (
              <p
                dir="rtl"
                className="mt-1 text-right text-sm font-semibold text-[#173C82]/70"
              >
                {vehicleNameArabic}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Daily Rate
            </p>

            <p className="mt-1 text-md font-bold text-[#173C82]">
              SAR {dailyRate.toFixed(2)}
            </p>
          </div>
        </div>

        {vehicleDescription ? (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            {vehicleDescription}
          </p>
        ) : (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">
            Professional transport service for reliable and comfortable travel.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[#F4F7FC] px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#173C82]/65">
              <UsersRound className="h-3.5 w-3.5 text-[#F45A2A]" />
              Capacity
            </div>

            <p className="mt-1 text-xs font-bold text-[#173C82]">
              Up to {passengerCapacity}{" "}
              {getPluralLabel(passengerCapacity, "passenger")}
            </p>
          </div>

          <div className="rounded-lg bg-[#FFF8F5] px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#D9481D]/70">
              <Snowflake className="h-3.5 w-3.5 text-[#F45A2A]" />
              Comfort
            </div>

            <p className="mt-1 text-xs font-bold text-slate-700">
              {vehicle.hasAirConditioning
                ? "Air conditioned"
                : "Standard comfort"}
            </p>
          </div>
        </div>

        {luggageCapacity > 0 && (
          <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-[#173C82]" />
            Luggage: {luggageCapacity}{" "}
            {getPluralLabel(luggageCapacity, "bag")}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
          <span className="text-xs font-semibold text-slate-400">
            Transport Inquiry
          </span>

          <button
            type="button"
            onClick={() => onInquire(vehicle)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#173C82] px-3.5 text-xs font-bold text-white transition hover:bg-[#102D63] focus:outline-none focus:ring-4 focus:ring-[#173C82]/15"
          >
            Request Quote
            <ArrowUpRight className="h-3.5 w-3.5 text-[#F45A2A]" />
          </button>
        </div>
      </div>
    </article>
  );
};