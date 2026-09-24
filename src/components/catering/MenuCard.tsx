import React from "react";
import { Check, Leaf, UtensilsCrossed } from "lucide-react";
import type { CateringMenuItem } from "../../services/catering/cateringService";

interface MenuCardProps {
  item: CateringMenuItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  isSelected,
  onToggle,
}) => {
  const pricePerPerson = getSafeNumber(item.pricePerPerson, 0);
  const dietaryTags = item.dietaryTags?.filter(Boolean) ?? [];
  const visibleDietaryTags = dietaryTags.slice(0, 2);
  const remainingDietaryTagCount = dietaryTags.length - visibleDietaryTags.length;

  const itemName = item.itemName?.en || "Catering Menu Item";
  const arabicItemName = item.itemName?.ar || "";

  return (
    <button
      type="button"
      onClick={() => onToggle(item._id)}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Remove" : "Add"} ${itemName} ${
        isSelected ? "from" : "to"
      } your catering menu`}
      className={`group relative flex min-h-48 w-full flex-col overflow-hidden rounded-xl border p-4 text-left transition ${
        isSelected
          ? "border-[#173C82] bg-[#F4F7FC] shadow-[0_5px_14px_rgba(23,60,130,0.10)]"
          : "border-slate-200 bg-white hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5]"
      } focus:outline-none focus:ring-4 focus:ring-[#173C82]/15`}
    >
      <div className="flex flex-1 items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                isSelected
                  ? "bg-[#173C82] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.category}
            </span>

            {visibleDietaryTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D9481D]"
              >
                <Leaf className="h-3 w-3 shrink-0" />
                {tag}
              </span>
            ))}

            {remainingDietaryTagCount > 0 && (
              <span className="text-[10px] font-bold text-slate-400">
                +{remainingDietaryTagCount}
              </span>
            )}
          </div>

          <h3 className="mt-3 truncate text-sm font-bold text-[#173C82]">
            {itemName}
          </h3>

          {arabicItemName && (
            <p
              dir="rtl"
              className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
            >
              {arabicItemName}
            </p>
          )}

          {item.description?.en ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
              {item.description.en}
            </p>
          ) : (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
              Freshly prepared catering option for your event menu.
            </p>
          )}
        </div>

        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
            isSelected
              ? "border-[#173C82] bg-[#173C82] text-white"
              : "border-slate-300 bg-white text-transparent group-hover:border-[#F45A2A]"
          }`}
          aria-hidden="true"
        >
          <Check className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <UtensilsCrossed className="h-3.5 w-3.5 text-[#F45A2A]" />
          Per Guest
        </span>

        <span className="text-sm font-bold text-[#173C82]">
          SAR {pricePerPerson.toFixed(2)}
        </span>
      </div>
    </button>
  );
};