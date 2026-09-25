import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Dome,
  Loader2,
  MessageCircle,
  RefreshCw,
  UsersRound,
  X,
} from "lucide-react";
import {
  hajjService,
  type HajjPackageItem,
  type PackageTier,
  type PackageType,
} from "../../services/hajj/hajjService";
import { PackageCard } from "../../components/hajj/PackageCard";

const packageTypes: Array<{ value: PackageType | ""; label: string }> = [
  { value: "", label: "All Packages" },
  { value: "Hajj", label: "Hajj" },
  { value: "Umrah", label: "Umrah" },
];

const packageTiers: Array<{ value: PackageTier | ""; label: string }> = [
  { value: "", label: "All Tiers" },
  { value: "Economy", label: "Economy" },
  { value: "Executive", label: "Executive" },
  { value: "VIP", label: "VIP" },
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

const getPackagePrice = (pkg: HajjPackageItem | null) => {
  if (!pkg) {
    return 0;
  }

  const standardPrice = getSafeNumber(pkg.price, 0);

  const discountedPrice =
    pkg.discountedPrice !== null && pkg.discountedPrice !== undefined
      ? getSafeNumber(pkg.discountedPrice, standardPrice)
      : null;

  return discountedPrice !== null && discountedPrice >= 0 && discountedPrice < standardPrice
    ? discountedPrice
    : standardPrice;
};

export const HajjPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<HajjPackageItem[]>([]);
  const [selectedType, setSelectedType] = useState<PackageType | "">("");
  const [selectedTier, setSelectedTier] = useState<PackageTier | "">("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activePackage, setActivePackage] = useState<HajjPackageItem | null>(
    null,
  );
  const [pilgrims, setPilgrims] = useState(1);
  const [departureDate, setDepartureDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [successData, setSuccessData] = useState<{
    packageName: string;
    bookingId: string;
    totalAmount: number;
    whatsappUrl: string | null;
  } | null>(null);

  const loadPackages = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await hajjService.getPackages({
        type: selectedType || undefined,
        tier: selectedTier || undefined,
      });

      setPackages(response.data.packages ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Hajj and Umrah packages.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPackages();
  }, [selectedType, selectedTier]);

  const activePackagePrice = useMemo(
    () => getPackagePrice(activePackage),
    [activePackage],
  );

  const safePilgrimCount = Math.max(0, getSafeNumber(pilgrims, 0));
  const estimatedTotal = activePackagePrice * safePilgrimCount;

  const closeBookingForm = () => {
    if (submitting) {
      return;
    }

    setActivePackage(null);
    setPilgrims(1);
    setDepartureDate("");
    setNotes("");
    setError(null);
  };

  const openPackageInquiry = (selectedPackage: HajjPackageItem) => {
    setError(null);
    setPilgrims(1);
    setDepartureDate("");
    setNotes("");
    setActivePackage(selectedPackage);
  };

  const handleBookingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!activePackage) {
      return;
    }

    if (safePilgrimCount < 1 || safePilgrimCount > 50) {
      setError("Please enter a number of pilgrims between 1 and 50.");
      return;
    }

    if (!departureDate) {
      setError("Please select an intended departure date.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await hajjService.submitBooking({
        packageId: activePackage._id,
        numberOfPilgrims: safePilgrimCount,
        departureDate,
        notes: notes.trim() || null,
      });

      setSuccessData({
        packageName: activePackage.title?.en || "Hajj and Umrah Package",
        bookingId: response.data.booking._id,
        totalAmount: getSafeNumber(response.data.booking.totalAmount, 0),
        whatsappUrl: response.data.customerWhatsAppUrl || null,
      });

      setActivePackage(null);
      setPilgrims(1);
      setDepartureDate("");
      setNotes("");
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit package inquiry.",
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
            Loading Hajj and Umrah packages...
          </span>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="relative overflow-hidden rounded-xl border border-[#DCE7FA] bg-linear-to-br from-[#F4F7FC] via-white to-[#FFF8F5] px-5 py-8 sm:px-8 sm:py-10">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-[#173C82]">
              <Dome className="h-4 w-4 text-[#F45A2A]" />

              <span className="text-[11px] font-bold uppercase tracking-wide">
                OmniBiz <span className="text-[#F45A2A]">Hajj & Umrah</span>
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
              Inquiry <span className="text-[#F45A2A]">Submitted</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Your package inquiry has been received and is ready for review by
              the Hajj and Umrah team.
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
            Package request received
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            Your inquiry for{" "}
            <span className="font-bold text-[#173C82]">
              {successData.packageName}
            </span>{" "}
            has been sent to the Hajj and Umrah team. They will review the
            request and contact you with the next steps.
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

            <p className="mt-1 text-md font-bold text-[#173C82]">
              SAR {successData.totalAmount.toFixed(2)}
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
              Return to Packages
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="relative overflow-hidden rounded-xl border border-[#DCE7FA] bg-linear-to-br from-[#F4F7FC] via-white to-[#FFF8F5] px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#173C82]">
            <Dome className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Hajj & Umrah</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Your Journey of <span className="text-[#F45A2A]">Faith</span>{" "}
            Begins Here
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Explore carefully prepared Hajj and Umrah packages, choose your
            preferred option and submit an inquiry directly to our team.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Available Packages
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Filter packages by pilgrimage type and preferred travel tier.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPackages(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center self-start rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60 lg:self-auto"
          title="Refresh packages"
          aria-label="Refresh packages"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {packageTypes.map((type) => {
          const isActive = selectedType === type.value;

          return (
            <button
              key={type.value || "all-package-types"}
              type="button"
              onClick={() => setSelectedType(type.value)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? "border-[#173C82] bg-[#173C82] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
              }`}
            >
              {type.label}
            </button>
          );
        })}

        <span className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

        {packageTiers.map((tier) => {
          const isActive = selectedTier === tier.value;

          return (
            <button
              key={tier.value || "all-package-tiers"}
              type="button"
              onClick={() => setSelectedTier(tier.value)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? "border-[#F45A2A] bg-[#F45A2A] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
              }`}
            >
              {tier.label}
            </button>
          );
        })}
      </div>

      {error && !activePackage && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activePackage ? (
        <section className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-start justify-between border-b border-slate-100 bg-[#F4F7FC] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#173C82]">
                <Dome className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Package Inquiry
                </span>
              </div>

              <h2 className="mt-2 truncate text-lg font-bold text-[#173C82]">
                {activePackage.title?.en || "Hajj and Umrah Package"}
              </h2>

              {activePackage.title?.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {activePackage.title.ar}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={closeBookingForm}
              disabled={submitting}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
              aria-label="Close package inquiry form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleBookingSubmit} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-3 rounded-lg bg-[#F4F7FC] p-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Package Type
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  {activePackage.packageType}
                </p>
              </div>

              <div className="border-t border-[#DCE7FA] pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Duration
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  {getSafeNumber(activePackage.durationDays, 0)} days
                </p>
              </div>

              <div className="border-t border-[#DCE7FA] pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Per Pilgrim
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  SAR {activePackagePrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Number of Pilgrims
                </label>

                <div className="relative">
                  <UsersRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pilgrims}
                    onChange={(event) =>
                      setPilgrims(getSafeNumber(event.target.value, 0))
                    }
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Intended Departure Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="date"
                    value={departureDate}
                    min={getTodaySaudiDate()}
                    onChange={(event) => setDepartureDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[#FFF8F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#D9481D]/70">
                Estimated Package Total
              </p>

              <p className="mt-1 text-md font-bold text-[#173C82]">
                SAR {estimatedTotal.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Final availability and payment details will be confirmed by the
                Hajj and Umrah team.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Special Requirements{" "}
                <span className="font-medium text-slate-400">(optional)</span>
              </label>

              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="For example: wheelchair assistance, room preference or group travel requirements"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-4 text-sm font-bold text-white transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Dome className="h-4 w-4 text-[#F45A2A]" />
              )}

              {submitting
                ? "Submitting Inquiry..."
                : "Submit Package Inquiry"}
            </button>
          </form>
        </section>
      ) : packages.length === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <Dome className="h-6 w-6 text-[#173C82]" />
          </div>

          <h2 className="mt-4 text-lg font-bold">
            <span className="text-[#173C82]">No Packages </span>
            <span className="text-[#F45A2A]">Found</span>
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            There are currently no active Hajj or Umrah packages matching your
            selection.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg._id}
              pkg={pkg}
              onSelect={openPackageInquiry}
            />
          ))}
        </section>
      )}
    </main>
  );
};