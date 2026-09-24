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

      setPackages(response.data.packages);
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

  const activePackagePrice = useMemo(() => {
    if (!activePackage) {
      return 0;
    }

    return activePackage.discountedPrice ?? activePackage.price;
  }, [activePackage]);

  const estimatedTotal = activePackagePrice * pilgrims;

  const closeBookingForm = () => {
    setActivePackage(null);
    setPilgrims(1);
    setDepartureDate("");
    setNotes("");
    setError(null);
  };

  const handleBookingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!activePackage) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await hajjService.submitBooking({
        packageId: activePackage._id,
        numberOfPilgrims: pilgrims,
        departureDate,
        notes: notes.trim() || null,
      });

      setSuccessData({
        packageName: activePackage.title.en,
        bookingId: response.data.booking._id,
        totalAmount: response.data.booking.totalAmount,
        whatsappUrl: response.data.customerWhatsAppUrl || null,
      });

      closeBookingForm();
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
      <div className="flex min-h-90 items-center justify-center">
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
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          <div className="border-b border-slate-100 bg-[#F8FAFE] px-6 py-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4F0]">
              <CheckCircle2 className="h-7 w-7 text-[#F45A2A]" />
            </div>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F45A2A]">
              Inquiry submitted
            </p>

            <h2 className="mt-1 text-xl font-bold">
              <span className="text-[#173C82]">Package Request </span>
              <span className="text-[#F45A2A]">Received</span>
            </h2>
          </div>

          <div className="space-y-5 p-6 text-center">
            <p className="text-sm leading-6 text-slate-500">
              Your inquiry for <strong>{successData.packageName}</strong> has
              been submitted. Our Hajj and Umrah team will review your request
              and contact you with the next steps.
            </p>

            <div className="rounded-xl border border-[#DCE7FA] bg-[#F4F7FC] p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Inquiry reference
              </p>

              <p className="mt-1 break-all text-sm font-bold text-[#173C82]">
                {successData.bookingId}
              </p>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Estimated total
              </p>

              <p className="mt-1 text-lg font-bold text-[#173C82]">
                SAR {successData.totalAmount.toFixed(2)}
              </p>
            </div>

            {successData.whatsappUrl && (
              <a
                href={successData.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F45A2A] py-3 text-sm font-bold text-white shadow-[0_6px_14px_rgba(244,90,42,0.20)] transition hover:bg-[#D9481D]"
              >
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp confirmation
              </a>
            )}

            <button
              type="button"
              onClick={() => setSuccessData(null)}
              className="text-xs font-bold text-[#173C82] transition hover:text-[#F45A2A]"
            >
              Return to packages
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="relative overflow-hidden rounded-2xl border border-[#DCE7FA] bg-linear-to-br from-[#F4F7FC] via-white to-[#FFF8F5] px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#F45A2A]">
            <Dome className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
              OmniBiz Hajj & Umrah
            </span>
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-[#173C82]">Your journey of </span>
            <span className="text-[#F45A2A]">faith</span>
            <span className="text-[#173C82]"> begins here.</span>
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Explore carefully prepared Hajj and Umrah packages, select your
            preferred option and submit your travel inquiry to our team.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {packageTypes.map((type) => {
            const isActive = selectedType === type.value;

            return (
              <button
                key={type.value || "all-package-types"}
                type="button"
                onClick={() => setSelectedType(type.value)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                  isActive
                    ? "border-[#173C82] bg-[#173C82] text-white shadow-[0_5px_12px_rgba(23,60,130,0.16)]"
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
                    ? "border-[#F45A2A] bg-[#F45A2A] text-white shadow-[0_5px_12px_rgba(244,90,42,0.16)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
                }`}
              >
                {tier.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void loadPackages(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#173C82] transition hover:text-[#F45A2A] disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh packages
        </button>
      </div>

      {error && !activePackage && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activePackage ? (
        <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          <div className="flex items-start justify-between border-b border-slate-100 bg-[#F8FAFE] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F45A2A]">
                Package inquiry
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                {activePackage.title.en}
              </h3>

              <p
                dir="rtl"
                className="mt-0.5 text-right text-xs font-semibold text-[#173C82]/70"
              >
                {activePackage.title.ar}
              </p>
            </div>

            <button
              type="button"
              onClick={closeBookingForm}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-[#F45A2A]/30 hover:bg-[#FFF4F0] hover:text-[#F45A2A]"
              aria-label="Close package inquiry form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleBookingSubmit} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-3 rounded-xl border border-[#DCE7FA] bg-[#F4F7FC] p-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Package type
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  {activePackage.packageType}
                </p>
              </div>

              <div className="border-l border-[#DCE7FA] pl-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Duration
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  {activePackage.durationDays} days
                </p>
              </div>

              <div className="border-l border-[#DCE7FA] pl-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Per pilgrim
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  SAR {activePackagePrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Number of pilgrims
                </label>

                <div className="relative">
                  <UsersRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pilgrims}
                    onChange={(event) =>
                      setPilgrims(Number(event.target.value))
                    }
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Intended departure date
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

            <div className="rounded-xl bg-[#FFF8F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D9481D]/70">
                Estimated package total
              </p>

              <p className="mt-1 text-xl font-bold text-[#173C82]">
                SAR {estimatedTotal.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Final package availability and payment details will be
                confirmed by our team.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Special requirements (optional)
              </label>

              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="For example: wheelchair assistance, room preference or any group travel requirement"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] py-3.5 text-sm font-bold text-white shadow-[0_7px_16px_rgba(23,60,130,0.20)] transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? "Submitting inquiry..."
                : "Submit package inquiry"}
            </button>
          </form>
        </div>
      ) : packages.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <Dome className="h-6 w-6 text-[#173C82]" />
          </div>

          <h3 className="mt-4 text-lg font-bold">
            <span className="text-[#173C82]">No Packages </span>
            <span className="text-[#F45A2A]">Found</span>
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            There are currently no active packages matching your selection.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg._id}
              pkg={pkg}
              onSelect={(selectedPackage) => {
                setError(null);
                setPilgrims(1);
                setDepartureDate("");
                setNotes("");
                setActivePackage(selectedPackage);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};