import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Home,
  Loader2,
  MessageCircle,
  RefreshCw,
  UsersRound,
  X,
} from "lucide-react";
import {
  rentalService,
  type ApartmentItem,
  type PropertyType,
} from "../../services/rental/rentalService";
import { ApartmentCard } from "../../components/rental/ApartmentCard";

const propertyTypes: Array<{ value: PropertyType | ""; label: string }> = [
  { value: "", label: "All stays" },
  { value: "Apartment", label: "Apartments" },
  { value: "Studio", label: "Studios" },
  { value: "Villa", label: "Villas" },
  { value: "Room", label: "Rooms" },
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

const getNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const checkInDate = new Date(`${checkIn}T00:00:00.000Z`);
  const checkOutDate = new Date(`${checkOut}T00:00:00.000Z`);

  const difference = checkOutDate.getTime() - checkInDate.getTime();

  return Math.max(0, difference / (1000 * 60 * 60 * 24));
};

export const RentalApartmentsPage: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentItem[]>([]);
  const [selectedPropertyType, setSelectedPropertyType] = useState<
    PropertyType | ""
  >("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeApartment, setActiveApartment] =
    useState<ApartmentItem | null>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [successData, setSuccessData] = useState<{
    bookingId: string;
    totalPrice: number;
    whatsappUrl: string | null;
  } | null>(null);

  const loadApartments = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await rentalService.getApartments({
        propertyType: selectedPropertyType || undefined,
      });

      setApartments(response.data.apartments);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load apartment listings.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadApartments();
  }, [selectedPropertyType]);

  const totalNights = useMemo(
    () => getNights(checkInDate, checkOutDate),
    [checkInDate, checkOutDate],
  );

  const stayEstimate = useMemo(() => {
    if (!activeApartment || totalNights <= 0) {
      return {
        nightlySubtotal: 0,
        cleaningFee: activeApartment?.cleaningFee || 0,
        total: 0,
      };
    }

    const nightlySubtotal = totalNights * activeApartment.pricePerNight;
    const cleaningFee = activeApartment.cleaningFee || 0;

    return {
      nightlySubtotal,
      cleaningFee,
      total: nightlySubtotal + cleaningFee,
    };
  }, [activeApartment, totalNights]);

  const closeBookingForm = () => {
    setActiveApartment(null);
    setCheckInDate("");
    setCheckOutDate("");
    setGuestCount(1);
    setSpecialRequests("");
    setError(null);
  };

  const handleBookingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeApartment) {
      return;
    }

    setError(null);

    if (totalNights <= 0) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    if (guestCount > activeApartment.maxGuests) {
      setError(
        `This property accommodates up to ${activeApartment.maxGuests} guests.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await rentalService.submitBooking({
        apartmentId: activeApartment._id,
        checkInDate,
        checkOutDate,
        guestCount,
        specialRequests: specialRequests.trim() || null,
      });

      setSuccessData({
        bookingId: response.data.booking._id,
        totalPrice: response.data.booking.totalPrice,
        whatsappUrl: response.data.customerWhatsAppUrl || null,
      });

      closeBookingForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit booking request.",
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
            Loading apartment listings...
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
              Booking Request Sent
            </p>

            <h2 className="mt-1 text-xl font-bold">
              <span className="text-[#173C82]">Your Stay Request </span>
              <span className="text-[#F45A2A]">Is Received</span>
            </h2>
          </div>

          <div className="space-y-5 p-6 text-center">
            <p className="text-sm leading-6 text-slate-500">
              Your accommodation booking request has been submitted. Our rental
              team will verify availability and contact you with confirmation.
            </p>

            <div className="rounded-xl border border-[#DCE7FA] bg-[#F4F7FC] p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Booking reference
              </p>

              <p className="mt-1 break-all text-sm font-bold text-[#173C82]">
                {successData.bookingId}
              </p>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Estimated total
              </p>

              <p className="mt-1 text-lg font-bold text-[#173C82]">
                SAR {successData.totalPrice.toFixed(2)}
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
              Return to stays
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
            <Home className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
              OmniBiz Stays
            </span>
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-[#173C82]">Stay comfortably, </span>
            <span className="text-[#F45A2A]">book confidently.</span>
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Browse furnished apartments and short-term stays, choose your dates
            and send a booking request to our accommodation team.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {propertyTypes.map((propertyType) => {
            const isActive = selectedPropertyType === propertyType.value;

            return (
              <button
                key={propertyType.value || "all"}
                type="button"
                onClick={() => setSelectedPropertyType(propertyType.value)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                  isActive
                    ? "border-[#173C82] bg-[#173C82] text-white shadow-[0_5px_12px_rgba(23,60,130,0.16)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
                }`}
              >
                {propertyType.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void loadApartments(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#173C82] transition hover:text-[#F45A2A] disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh listings
        </button>
      </div>

      {error && !activeApartment && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeApartment ? (
        <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          <div className="flex items-start justify-between border-b border-slate-100 bg-[#F8FAFE] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F45A2A]">
                Stay Booking
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                {activeApartment.title.en}
              </h3>

              <p
                dir="rtl"
                className="mt-0.5 text-right text-xs font-semibold text-[#173C82]/70"
              >
                {activeApartment.title.ar}
              </p>
            </div>

            <button
              type="button"
              onClick={closeBookingForm}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-[#F45A2A]/30 hover:bg-[#FFF4F0] hover:text-[#F45A2A]"
              aria-label="Close rental booking form"
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
                  Nightly rate
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  SAR {activeApartment.pricePerNight.toFixed(2)}
                </p>
              </div>

              <div className="border-l border-[#DCE7FA] pl-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Cleaning fee
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  SAR {activeApartment.cleaningFee.toFixed(2)}
                </p>
              </div>

              <div className="border-l border-[#DCE7FA] pl-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Max guests
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  {activeApartment.maxGuests}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Check-in date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="date"
                    value={checkInDate}
                    min={getTodaySaudiDate()}
                    onChange={(event) => {
                      const selectedDate = event.target.value;

                      setCheckInDate(selectedDate);

                      if (checkOutDate && checkOutDate <= selectedDate) {
                        setCheckOutDate("");
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Check-out date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F45A2A]" />

                  <input
                    type="date"
                    value={checkOutDate}
                    min={checkInDate || getTodaySaudiDate()}
                    onChange={(event) => setCheckOutDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Number of guests
              </label>

              <div className="relative">
                <UsersRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                <input
                  type="number"
                  min="1"
                  max={activeApartment.maxGuests}
                  value={guestCount}
                  onChange={(event) =>
                    setGuestCount(Number(event.target.value))
                  }
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Special requests (optional)
              </label>

              <textarea
                rows={3}
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
                placeholder="Arrival time, accessibility needs or any other request"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div className="rounded-xl bg-[#FFF8F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D9481D]/70">
                Stay estimate
              </p>

              <p className="mt-1 text-xl font-bold text-[#173C82]">
                SAR {stayEstimate.total.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {totalNights > 0
                  ? `${totalNights} night${totalNights > 1 ? "s" : ""} · SAR ${stayEstimate.nightlySubtotal.toFixed(2)} stay cost + SAR ${stayEstimate.cleaningFee.toFixed(2)} cleaning`
                  : "Select check-in and check-out dates to see the estimate."}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || totalNights <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] py-3.5 text-sm font-bold text-white shadow-[0_7px_16px_rgba(23,60,130,0.20)] transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {submitting ? "Submitting booking..." : "Submit stay request"}
            </button>
          </form>
        </div>
      ) : apartments.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <Home className="h-6 w-6 text-[#173C82]" />
          </div>

          <h3 className="mt-4 text-lg font-bold">
            <span className="text-[#173C82]">No Stays </span>
            <span className="text-[#F45A2A]">Found</span>
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            There are currently no active rentals in this category.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {apartments.map((apartment) => (
            <ApartmentCard
              key={apartment._id}
              apartment={apartment}
              onSelect={(selectedApartment) => {
                setError(null);
                setCheckInDate("");
                setCheckOutDate("");
                setGuestCount(1);
                setSpecialRequests("");
                setActiveApartment(selectedApartment);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};