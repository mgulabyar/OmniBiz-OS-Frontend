import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Sparkles,
  UtensilsCrossed,
  UsersRound,
} from "lucide-react";
import {
  cateringService,
  type CateringCategory,
  type CateringEventType,
  type CateringMenuItem,
} from "../../services/catering/cateringService";
import { MenuCard } from "../../components/catering/MenuCard";

const categories: Array<{ value: CateringCategory | ""; label: string }> = [
  { value: "", label: "All Menu" },
  { value: "Appetizer", label: "Appetizers" },
  { value: "Main Course", label: "Main Course" },
  { value: "Dessert", label: "Desserts" },
  { value: "Beverage", label: "Beverages" },
];

const eventTypes: Array<{ value: CateringEventType; label: string }> = [
  { value: "Wedding", label: "Wedding" },
  { value: "Corporate", label: "Corporate" },
  { value: "Birthday Party", label: "Birthday Party" },
  { value: "Private Dinner", label: "Private Dinner" },
  { value: "Other", label: "Other" },
];

const getTodaySaudiDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const CateringPage: React.FC = () => {
  const [menu, setMenu] = useState<CateringMenuItem[]>([]);
  const [menuById, setMenuById] = useState<Record<string, CateringMenuItem>>(
    {},
  );
  const [selectedCategory, setSelectedCategory] = useState<
    CateringCategory | ""
  >("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState(50);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venueLocation, setVenueLocation] = useState("");
  const [eventType, setEventType] = useState<CateringEventType>("Wedding");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [successData, setSuccessData] = useState<{
    bookingId: string;
    total: number;
    whatsappUrl: string | null;
  } | null>(null);

  const loadMenu = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await cateringService.getMenu(
        selectedCategory || undefined,
      );

      const menuItems = response.data.menuItems;

      setMenu(menuItems);

      setMenuById((currentItems) => {
        const updatedItems = { ...currentItems };

        menuItems.forEach((item) => {
          updatedItems[item._id] = item;
        });

        return updatedItems;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load catering menu.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadMenu();
  }, [selectedCategory]);

  const selectedMenuItems = useMemo(
    () =>
      selectedItems
        .map((itemId) => menuById[itemId])
        .filter((item): item is CateringMenuItem => Boolean(item)),
    [menuById, selectedItems],
  );

  const estimatedPricePerPerson = useMemo(
    () =>
      selectedMenuItems.reduce(
        (total, item) => total + getSafeNumber(item.pricePerPerson, 0),
        0,
      ),
    [selectedMenuItems],
  );

  const safeGuestCount = Math.max(0, getSafeNumber(guestCount, 0));
  const totalEstimate = estimatedPricePerPerson * safeGuestCount;

  const handleItemToggle = (id: string) => {
    setSelectedItems((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );
  };

  const resetRfqForm = () => {
    setSelectedItems([]);
    setGuestCount(50);
    setEventDate("");
    setEventTime("");
    setVenueLocation("");
    setEventType("Wedding");
    setNotes("");
  };

  const handleRfqSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (selectedItems.length === 0) {
      setError("Please select at least one menu item for your quotation.");
      return;
    }

    if (selectedMenuItems.length !== selectedItems.length) {
      setError(
        "Some selected menu items could not be verified. Please refresh the menu and try again.",
      );
      return;
    }

    if (safeGuestCount < 10) {
      setError("Catering inquiries require at least 10 guests.");
      return;
    }

    if (!eventDate) {
      setError("Please select an event date.");
      return;
    }

    if (!venueLocation.trim()) {
      setError("Please enter the venue location.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await cateringService.submitCateringBooking({
        eventDate,
        eventTime: eventTime || null,
        venueLocation: venueLocation.trim(),
        guestCount: safeGuestCount,
        selectedItems,
        eventType,
        notes: notes.trim() || null,
      });

      setSuccessData({
        bookingId: response.data.booking._id,
        total: getSafeNumber(response.data.booking.totalEstimatedCost, 0),
        whatsappUrl: response.data.customerWhatsAppUrl || null,
      });

      resetRfqForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit catering request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#173C82]" />
          <span className="text-sm font-semibold text-slate-500">
            Loading catering menu...
          </span>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="relative overflow-hidden rounded-xl border border-[#DCE7FA] bg-linear-to-br from-[#F4F7FC] via-white to-[#FFF8F5] px-5 py-8 sm:px-8 sm:py-10">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-[#173C82]">
              <UtensilsCrossed className="h-4 w-4 text-[#F45A2A]" />

              <span className="text-[11px] font-bold uppercase tracking-wide">
                OmniBiz <span className="text-[#F45A2A]">Catering</span>
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
              Request <span className="text-[#F45A2A]">Submitted</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Your catering request has been received and is ready for review by
              our event and menu team.
            </p>
          </div>

          <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
          <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
        </section>

        <section className="mx-auto mt-8 max-w-md rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF4F0]">
            <CheckCircle2 className="h-6 w-6 text-[#F45A2A]" />
          </div>

          <h2 className="mt-4 text-center text-lg font-bold text-[#173C82]">
            Catering request received
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            Our team will review your selected menu, guest count and event
            requirements before sharing the final quotation.
          </p>

          <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Inquiry Reference
            </p>

            <p className="mt-1 break-all text-sm font-bold text-[#173C82]">
              {successData.bookingId}
            </p>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Estimated Total
            </p>

            <p className="mt-1 text-lg font-bold text-[#173C82]">
              SAR {successData.total.toFixed(2)}
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {successData.whatsappUrl && (
              <a
                href={successData.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-4 text-sm font-bold text-white transition hover:bg-[#102D63]"
              >
                <MessageCircle className="h-4 w-4 text-[#F45A2A]" />
                Open WhatsApp Confirmation
              </a>
            )}

            <button
              type="button"
              onClick={() => setSuccessData(null)}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-[#173C82] transition hover:bg-[#F4F7FC]"
            >
              Return to Catering Menu
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="relative overflow-hidden rounded-xl border border-[#DCE7FA] bg-linear-to-br from-[#F4F7FC] via-white to-[#FFF8F5] px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#173C82]">
            <UtensilsCrossed className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Catering</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Plan a Menu Worth{" "}
            <span className="text-[#F45A2A]">Remembering</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Select your preferred menu items, add event details and receive a
            tailored catering quotation from our team.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Catering Menu
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Select dishes to create a custom menu for your event.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMenu(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center self-start rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60 lg:self-auto"
          title="Refresh catering menu"
          aria-label="Refresh catering menu"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = selectedCategory === category.value;

          return (
            <button
              key={category.value || "all"}
              type="button"
              onClick={() => setSelectedCategory(category.value)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? "border-[#173C82] bg-[#173C82] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#F45A2A]">
                Menu Selection
              </p>

              <h2 className="mt-1 text-xl font-bold text-[#173C82]">
                Build Your <span className="text-[#F45A2A]">Catering Menu</span>
              </h2>
            </div>

            <span className="rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-xs font-bold text-[#173C82]">
              {selectedItems.length} selected
            </span>
          </div>

          {menu.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
                <UtensilsCrossed className="h-6 w-6 text-[#173C82]" />
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#173C82]">
                No Menu Items Found
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                No active menu items are available in this category.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {menu.map((item) => (
                <MenuCard
                  key={item._id}
                  item={item}
                  isSelected={selectedItems.includes(item._id)}
                  onToggle={handleItemToggle}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 sm:p-6 xl:sticky xl:top-24">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-[#173C82]">
              <Sparkles className="h-4 w-4 text-[#F45A2A]" />

              <span className="text-[11px] font-bold uppercase tracking-wide">
                Request for Quotation
              </span>
            </div>

            <h2 className="mt-2 text-lg font-bold text-[#173C82]">
              Event <span className="text-[#F45A2A]">Details</span>
            </h2>
          </div>

          <form onSubmit={handleRfqSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Event Type
              </label>

              <select
                value={eventType}
                onChange={(event) =>
                  setEventType(event.target.value as CateringEventType)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Venue Location
              </label>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                <input
                  type="text"
                  value={venueLocation}
                  onChange={(event) => setVenueLocation(event.target.value)}
                  placeholder="e.g. Riyadh Convention Center"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Event Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="date"
                    value={eventDate}
                    min={getTodaySaudiDate()}
                    onChange={(event) => setEventDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-2 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Event Time{" "}
                  <span className="font-medium text-slate-400">(optional)</span>
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="time"
                    value={eventTime}
                    onChange={(event) => setEventTime(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-2 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Guest Count
              </label>

              <div className="relative">
                <UsersRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={guestCount}
                  onChange={(event) =>
                    setGuestCount(getSafeNumber(event.target.value, 0))
                  }
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Special Requirements{" "}
                <span className="font-medium text-slate-400">(optional)</span>
              </label>

              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Dietary restrictions, serving style, event theme or special requests"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div className="rounded-lg bg-[#F4F7FC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#173C82]/65">
                Estimated Quotation
              </p>

              <p className="mt-1 text-xl font-bold text-[#173C82]">
                SAR {totalEstimate.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                SAR {estimatedPricePerPerson.toFixed(2)} per guest ·{" "}
                {selectedItems.length} menu item
                {selectedItems.length !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || selectedItems.length === 0}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-4 text-sm font-bold text-white transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-[#F45A2A]" />
              )}

              {submitting
                ? "Submitting Request..."
                : "Submit Quotation Request"}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
};
