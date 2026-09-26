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
  { value: "", label: "All Stays" },
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

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const getNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const checkInDate = new Date(`${checkIn}T00:00:00.000Z`);
  const checkOutDate = new Date(`${checkOut}T00:00:00.000Z`);

  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime())
  ) {
    return 0;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const difference = checkOutDate.getTime() - checkInDate.getTime();

  return difference > 0 ? Math.round(difference / millisecondsPerDay) : 0;
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

      setApartments(response.data.apartments ?? []);
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

  const apartmentNightlyRate = useMemo(
    () => getSafeNumber(activeApartment?.pricePerNight, 0),
    [activeApartment],
  );

  const apartmentCleaningFee = useMemo(
    () => getSafeNumber(activeApartment?.cleaningFee, 0),
    [activeApartment],
  );

  const apartmentMaxGuests = useMemo(
    () => Math.max(1, getSafeNumber(activeApartment?.maxGuests, 1)),
    [activeApartment],
  );

  const safeGuestCount = Math.max(0, getSafeNumber(guestCount, 0));

  const stayEstimate = useMemo(() => {
    const nightlySubtotal = totalNights * apartmentNightlyRate;
    const cleaningFee = apartmentCleaningFee;

    return {
      nightlySubtotal,
      cleaningFee,
      total: totalNights > 0 ? nightlySubtotal + cleaningFee : 0,
    };
  }, [apartmentCleaningFee, apartmentNightlyRate, totalNights]);

  const closeBookingForm = () => {
    if (submitting) {
      return;
    }

    setActiveApartment(null);
    setCheckInDate("");
    setCheckOutDate("");
    setGuestCount(1);
    setSpecialRequests("");
    setError(null);
  };

  const openBookingForm = (selectedApartment: ApartmentItem) => {
    setError(null);
    setCheckInDate("");
    setCheckOutDate("");
    setGuestCount(1);
    setSpecialRequests("");
    setActiveApartment(selectedApartment);
  };

  const handleBookingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeApartment) {
      return;
    }

    if (!checkInDate || !checkOutDate || totalNights <= 0) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    if (safeGuestCount < 1) {
      setError("Please enter at least one guest.");
      return;
    }

    if (safeGuestCount > apartmentMaxGuests) {
      setError(
        `This property accommodates up to ${apartmentMaxGuests} guests.`,
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await rentalService.submitBooking({
        apartmentId: activeApartment._id,
        checkInDate,
        checkOutDate,
        guestCount: safeGuestCount,
        specialRequests: specialRequests.trim() || null,
      });

      setSuccessData({
        bookingId: response.data.booking._id,
        totalPrice: getSafeNumber(response.data.booking.totalPrice, 0),
        whatsappUrl: response.data.customerWhatsAppUrl || null,
      });

      setActiveApartment(null);
      setCheckInDate("");
      setCheckOutDate("");
      setGuestCount(1);
      setSpecialRequests("");
      setError(null);
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
      <div className="flex min-h-80 items-center justify-center">
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
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="relative overflow-hidden rounded-xl border border-[#DCE7FA] bg-linear-to-br from-[#F4F7FC] via-white to-[#FFF8F5] px-5 py-8 sm:px-8 sm:py-10">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-[#173C82]">
              <Home className="h-4 w-4 text-[#F45A2A]" />

              <span className="text-[11px] font-bold uppercase tracking-wide">
                OmniBiz <span className="text-[#F45A2A]">Rentals</span>
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
              Booking Request <span className="text-[#F45A2A]">Sent</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Your stay request has been received and is ready for availability
              review by the rental team.
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
            Stay request received
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            Your accommodation booking request has been submitted. The rental
            team will verify availability and contact you with confirmation.
          </p>

          <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Booking Reference
            </p>

            <p className="mt-1 break-all text-sm font-bold text-[#173C82]">
              {successData.bookingId}
            </p>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Estimated Total
            </p>

            <p className="mt-1 text-sm font-bold text-[#173C82]">
              SAR {successData.totalPrice.toFixed(2)}
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
              Return to Stays
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
            <Home className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Rentals</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Stay Comfortably,{" "}
            <span className="text-[#F45A2A]">Book Confidently</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Browse furnished apartments and short-term stays, select your dates
            and send a booking request to the accommodation team.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Available Stays
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Choose accommodation that matches your stay and group requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadApartments(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center self-start rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60 lg:self-auto"
          title="Refresh rental listings"
          aria-label="Refresh rental listings"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {propertyTypes.map((propertyType) => {
          const isActive = selectedPropertyType === propertyType.value;

          return (
            <button
              key={propertyType.value || "all"}
              type="button"
              onClick={() => setSelectedPropertyType(propertyType.value)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? "border-[#173C82] bg-[#173C82] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
              }`}
            >
              {propertyType.label}
            </button>
          );
        })}
      </div>

      {error && !activeApartment && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeApartment ? (
        <section className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-start justify-between border-b border-slate-100 bg-[#F4F7FC] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#173C82]">
                <Home className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Stay Booking
                </span>
              </div>

              <h2 className="mt-2 truncate text-lg font-bold text-[#173C82]">
                {activeApartment.title?.en || "Rental Apartment"}
              </h2>

              {activeApartment.title?.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {activeApartment.title.ar}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={closeBookingForm}
              disabled={submitting}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
              aria-label="Close rental booking form"
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
                  Nightly Rate
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  SAR {apartmentNightlyRate.toFixed(2)}
                </p>
              </div>

              <div className="border-t border-[#DCE7FA] pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Cleaning Fee
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  SAR {apartmentCleaningFee.toFixed(2)}
                </p>
              </div>

              <div className="border-t border-[#DCE7FA] pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Max Guests
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  {apartmentMaxGuests}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Check-In Date
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
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Check-Out Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F45A2A]" />

                  <input
                    type="date"
                    value={checkOutDate}
                    min={checkInDate || getTodaySaudiDate()}
                    onChange={(event) => setCheckOutDate(event.target.value)}
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Number of Guests
              </label>

              <div className="relative">
                <UsersRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                <input
                  type="number"
                  min="1"
                  max={apartmentMaxGuests}
                  value={guestCount}
                  onChange={(event) =>
                    setGuestCount(getSafeNumber(event.target.value, 0))
                  }
                  className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Special Requests{" "}
                <span className="font-medium text-slate-400">(optional)</span>
              </label>

              <textarea
                rows={3}
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
                placeholder="Arrival time, accessibility needs or other requests"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <div className="rounded-lg bg-[#FFF8F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#D9481D]/70">
                Stay Estimate
              </p>

              <p className="mt-1 text-md font-bold text-[#173C82]">
                SAR {stayEstimate.total.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {totalNights > 0
                  ? `${totalNights} night${
                      totalNights !== 1 ? "s" : ""
                    } · SAR ${stayEstimate.nightlySubtotal.toFixed(
                      2,
                    )} stay cost + SAR ${stayEstimate.cleaningFee.toFixed(
                      2,
                    )} cleaning`
                  : "Select check-in and check-out dates to see the estimate."}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || totalNights <= 0}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#173C82] px-4 text-sm font-bold text-white transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Home className="h-4 w-4 text-[#F45A2A]" />
              )}

              {submitting ? "Submitting Booking..." : "Submit Stay Request"}
            </button>
          </form>
        </section>
      ) : apartments.length === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <Home className="h-6 w-6 text-[#173C82]" />
          </div>

          <h2 className="mt-4 text-lg font-bold">
            <span className="text-[#173C82]">No Stays </span>
            <span className="text-[#F45A2A]">Found</span>
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            There are currently no active rentals in this category.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {apartments.map((apartment) => (
            <ApartmentCard
              key={apartment._id}
              apartment={apartment}
              onSelect={openBookingForm}
            />
          ))}
        </section>
      )}
    </main>
  );
};