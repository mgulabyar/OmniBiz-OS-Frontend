import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import {
  rentalService,
  type RentalBookingItem,
  type RentalBookingStatus,
} from "../../services/rental/rentalService";

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

const statusConfig: Record<
  RentalBookingStatus,
  { label: string; className: string }
> = {
  Pending: {
    label: "Awaiting Confirmation",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  Confirmed: {
    label: "Confirmed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  Rejected: {
    label: "Not Available",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  Cancelled: {
    label: "Cancelled",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  Completed: {
    label: "Completed",
    className: "border-[#DCE7FA] bg-[#F4F7FC] text-[#173C82]",
  },
};

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const getBookingNightCount = (booking: RentalBookingItem) => {
  const savedNights = getSafeNumber(booking.totalNights, 0);

  if (savedNights > 0) {
    return savedNights;
  }

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime())
  ) {
    return 0;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const calculatedNights = Math.round(
    (checkOut.getTime() - checkIn.getTime()) / millisecondsPerDay,
  );

  return calculatedNights > 0 ? calculatedNights : 0;
};

const getBookingNightlyRate = (booking: RentalBookingItem) => {
  const savedNightlyRate = getSafeNumber(booking.pricePerNight, 0);

  if (savedNightlyRate > 0) {
    return savedNightlyRate;
  }

  return getSafeNumber(booking.apartment?.pricePerNight, 0);
};

const getBookingTotal = (booking: RentalBookingItem) => {
  const savedTotal = getSafeNumber(booking.totalPrice, 0);

  if (savedTotal > 0) {
    return savedTotal;
  }

  const nightlyRate = getBookingNightlyRate(booking);
  const totalNights = getBookingNightCount(booking);
  const cleaningFee = getSafeNumber(booking.apartment?.cleaningFee, 0);

  return nightlyRate * totalNights + cleaningFee;
};

export const MyRentalBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<RentalBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<RentalBookingItem | null>(
    null,
  );
  const [cancellationReason, setCancellationReason] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadBookings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await rentalService.getAllBookings();

      if (response.status === "success") {
        setBookings(response.data.bookings ?? []);
      }
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load stay bookings.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const bookingCountLabel = useMemo(() => {
    return `${bookings.length} stay ${
      bookings.length === 1 ? "booking" : "bookings"
    }`;
  }, [bookings.length]);

  const closeCancelDialog = () => {
    if (cancellingId) {
      return;
    }

    setCancelTarget(null);
    setCancellationReason("");
  };

  const openCancelDialog = (booking: RentalBookingItem) => {
    setCancelTarget(booking);
    setCancellationReason("");
  };

  const handleCancelBooking = async () => {
    if (!cancelTarget) {
      return;
    }

    setCancellingId(cancelTarget._id);

    try {
      const response = await rentalService.cancelMyRentalBooking(
        cancelTarget._id,
        cancellationReason.trim() || undefined,
      );

      if (response.status === "success") {
        showToast("success", "Your stay booking has been cancelled.");
        setCancelTarget(null);
        setCancellationReason("");
        await loadBookings(true);
      }
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel this stay booking.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const openWhatsApp = (booking: RentalBookingItem) => {
    if (booking.customerWhatsAppUrl) {
      window.open(
        booking.customerWhatsAppUrl,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    const message = `Salam! I need assistance with my rental booking.\nReference: ${booking._id}\nApartment: ${
      booking.apartment?.title?.en || "Rental Apartment"
    }\nCheck-in: ${booking.checkInDate || "Not specified"}\nCheck-out: ${
      booking.checkOutDate || "Not specified"
    }\nGuests: ${Math.max(1, getSafeNumber(booking.guestCount, 1))}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#173C82]" />
          <p className="text-sm font-semibold text-slate-500">
            Loading stay bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {toast && (
        <div
          className={`fixed right-4 top-24 z-100 flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border p-4 shadow-xl sm:right-6 ${
            toast.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
          role="alert"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}

          <p className="flex-1 text-sm font-semibold leading-5">
            {toast.message}
          </p>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-current opacity-60 transition hover:opacity-100"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="relative overflow-hidden rounded-xl border border-[#DCE7FA] bg-linear-to-br from-[#F4F7FC] via-white to-[#FFF8F5] px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#173C82]">
            <Home className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Rentals</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            My Stay <span className="text-[#F45A2A]">Bookings</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Review your short-term rental requests, check-in dates,
            accommodation details and current booking status.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Booking History
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {bookingCountLabel} found.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadBookings(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh stay bookings"
          aria-label="Refresh stay bookings"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {bookings.length === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <Home className="h-6 w-6 text-[#173C82]" />
          </div>

          <h2 className="mt-4 text-lg font-bold">
            <span className="text-[#173C82]">No Stay </span>
            <span className="text-[#F45A2A]">Bookings Yet</span>
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Submit a stay request from the rental listings page and your booking
            progress will appear here.
          </p>
        </section>
      ) : (
        <section className="mt-8 space-y-4">
          {bookings.map((booking) => {
            const status =
              statusConfig[booking.bookingStatus] || statusConfig.Pending;

            const canCancel = booking.bookingStatus === "Pending";

            const apartmentTitle =
              booking.apartment?.title?.en || "Rental Apartment";

            const apartmentArabicTitle = booking.apartment?.title?.ar || "";

            const propertyType =
              booking.apartment?.propertyType || "Short-Term";

            const totalNights = getBookingNightCount(booking);
            const guestCount = Math.max(
              1,
              getSafeNumber(booking.guestCount, 1),
            );
            const pricePerNight = getBookingNightlyRate(booking);
            const totalPrice = getBookingTotal(booking);

            return (
              <article
                key={booking._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#173C82]/20 hover:shadow-[0_10px_24px_rgba(23,60,130,0.08)]"
              >
                <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#F45A2A]">
                          {propertyType} Stay
                        </p>

                        <h2 className="mt-1 truncate text-base font-bold text-[#173C82]">
                          {apartmentTitle}
                        </h2>

                        {apartmentArabicTitle && (
                          <p
                            dir="rtl"
                            className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                          >
                            {apartmentArabicTitle}
                          </p>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-slate-400">
                        Ref. {booking._id.slice(-8).toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-[#F4F7FC] p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#173C82]/65">
                          <CalendarDays className="h-3.5 w-3.5 text-[#173C82]" />
                          Check-In
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {booking.checkInDate || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#FFF8F5] p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#D9481D]/70">
                          <CalendarDays className="h-3.5 w-3.5 text-[#F45A2A]" />
                          Check-Out
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {booking.checkOutDate || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <UsersRound className="h-3.5 w-3.5 text-[#173C82]" />
                          Stay Details
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {totalNights > 0
                            ? `${totalNights} night${
                                totalNights !== 1 ? "s" : ""
                              }`
                            : "To be confirmed"}
                        </p>

                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {guestCount} guest{guestCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {booking.apartment?.locationName && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-[#F45A2A]" />
                        {booking.apartment.locationName}
                      </div>
                    )}

                    {booking.specialRequests && (
                      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Your Requests
                        </p>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {booking.specialRequests}
                        </p>
                      </div>
                    )}

                    {booking.adminResponse && (
                      <div className="mt-4 rounded-lg bg-[#F4F7FC] p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#173C82]/65">
                          Rental Team Response
                        </p>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {booking.adminResponse}
                        </p>
                      </div>
                    )}

                    {booking.bookingStatus === "Cancelled" &&
                      booking.cancellationReason && (
                        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                            Cancellation Reason
                          </p>

                          <p className="mt-1 text-xs font-medium text-red-700">
                            {booking.cancellationReason}
                          </p>
                        </div>
                      )}
                  </div>

                  <aside className="flex flex-col justify-between rounded-lg bg-slate-50 p-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Booking Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-md border px-2.5 py-1.5 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>

                      <div className="mt-5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Estimated Total
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#173C82]">
                          <CircleDollarSign className="h-5 w-5 text-[#F45A2A]" />
                          SAR {totalPrice.toFixed(2)}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          SAR {pricePerNight.toFixed(2)} per night
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <button
                        type="button"
                        onClick={() => openWhatsApp(booking)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-3 text-xs font-bold text-white transition hover:bg-[#102D63]"
                      >
                        <MessageCircle className="h-4 w-4 text-[#F45A2A]" />
                        WhatsApp
                      </button>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => openCancelDialog(booking)}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </aside>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {cancelTarget && (
        <div
          className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCancelDialog();
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.25)] sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-rental-booking-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#173C82]">
                  <Home className="h-4 w-4 text-[#F45A2A]" />

                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    OmniBiz <span className="text-[#F45A2A]">Rentals</span>
                  </span>
                </div>

                <h2
                  id="cancel-rental-booking-title"
                  className="mt-3 text-xl font-bold tracking-tight text-[#173C82]"
                >
                  Cancel <span className="text-[#F45A2A]">Booking</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeCancelDialog}
                disabled={Boolean(cancellingId)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
                aria-label="Close cancellation dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Selected Stay
              </p>

              <p className="mt-1 text-sm font-bold text-[#173C82]">
                {cancelTarget.apartment?.title?.en || "Rental Apartment"}
              </p>

              {cancelTarget.apartment?.title?.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {cancelTarget.apartment.title.ar}
                </p>
              )}

              <p className="mt-2 text-xs font-medium text-slate-500">
                {cancelTarget.checkInDate || "Not specified"} to{" "}
                {cancelTarget.checkOutDate || "Not specified"} ·{" "}
                {Math.max(
                  1,
                  getSafeNumber(cancelTarget.guestCount, 1),
                )}{" "}
                guest
                {Math.max(
                  1,
                  getSafeNumber(cancelTarget.guestCount, 1),
                ) !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Cancellation Reason{" "}
                <span className="font-medium text-slate-400">(optional)</span>
              </label>

              <textarea
                rows={4}
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Tell us why you would like to cancel this stay booking..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelDialog}
                disabled={Boolean(cancellingId)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Booking
              </button>

              <button
                type="button"
                onClick={() => void handleCancelBooking()}
                disabled={Boolean(cancellingId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancellingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}

                {cancellingId ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};