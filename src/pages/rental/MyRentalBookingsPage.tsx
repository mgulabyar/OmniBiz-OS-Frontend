import React, { useEffect, useState } from "react";
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
        setBookings(response.data.bookings);
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

  const closeCancelDialog = () => {
    if (cancellingId) {
      return;
    }

    setCancelTarget(null);
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

    const message = `Salam! I need assistance with my rental booking.\nReference: ${booking._id}\nApartment: ${booking.apartment?.title?.en || "Apartment"}\nCheck-in: ${booking.checkInDate}\nCheck-out: ${booking.checkOutDate}\nGuests: ${booking.guestCount}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-105 items-center justify-center">
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
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
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

      <header className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#F45A2A]">
            <Home className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
              Rental Portal
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-[#173C82]">My Stay </span>
            <span className="text-[#F45A2A]">Bookings</span>
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">
            Review short-term rental requests, dates and accommodation status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadBookings(true)}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-[#173C82] shadow-sm transition hover:border-[#173C82]/30 hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh bookings
        </button>
      </header>

      {bookings.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F7FC]">
            <Home className="h-7 w-7 text-[#173C82]" />
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
        <section className="space-y-5">
          {bookings.map((booking) => {
            const status =
              statusConfig[booking.bookingStatus] || statusConfig.Pending;

            const canCancel = booking.bookingStatus === "Pending";

            const apartmentTitle =
              booking.apartment?.title?.en || "Rental Apartment";

            const apartmentArabicTitle = booking.apartment?.title?.ar || "";

            return (
              <article
                key={booking._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,0.04)] transition hover:border-[#173C82]/25 hover:shadow-[0_12px_28px_rgba(23,60,130,0.07)] sm:p-6"
              >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
                  <div className="min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F45A2A]">
                          {booking.apartment?.propertyType || "Short-Term"} Stay
                        </p>

                        <h2 className="mt-1 truncate text-lg font-bold text-[#173C82]">
                          {apartmentTitle}
                        </h2>

                        {apartmentArabicTitle && (
                          <p
                            dir="rtl"
                            className="mt-1 text-right text-xs font-semibold text-slate-500"
                          >
                            {apartmentArabicTitle}
                          </p>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-slate-400">
                        Ref. {booking._id.slice(-8).toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-[#F8FAFE] p-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#173C82]/60">
                          <CalendarDays className="h-3.5 w-3.5 text-[#173C82]" />
                          Check-in
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {booking.checkInDate}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#FFF8F5] p-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#D9481D]/70">
                          <CalendarDays className="h-3.5 w-3.5 text-[#F45A2A]" />
                          Check-out
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {booking.checkOutDate}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          <UsersRound className="h-3.5 w-3.5 text-[#173C82]" />
                          Stay details
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {booking.totalNights || 0} night
                          {booking.totalNights !== 1 ? "s" : ""}
                        </p>

                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {booking.guestCount || 1} guest
                          {booking.guestCount !== 1 ? "s" : ""}
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
                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Your requests
                        </p>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {booking.specialRequests}
                        </p>
                      </div>
                    )}

                    {booking.adminResponse && (
                      <div className="mt-4 rounded-xl bg-[#F4F7FC] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#173C82]/65">
                          Rental team response
                        </p>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {booking.adminResponse}
                        </p>
                      </div>
                    )}

                    {booking.bookingStatus === "Cancelled" &&
                      booking.cancellationReason && (
                        <p className="mt-4 text-xs font-medium text-red-600">
                          Cancellation reason: {booking.cancellationReason}
                        </p>
                      )}
                  </div>

                  <aside className="flex flex-col justify-between rounded-xl bg-slate-50 p-4 sm:p-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        Current status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-md border px-2.5 py-1.5 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>

                      <div className="mt-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          Estimated total
                        </p>

                        <p className="mt-1.5 flex items-center gap-1.5 text-xl font-bold text-[#173C82]">
                          <CircleDollarSign className="h-5 w-5 text-[#F45A2A]" />
                          SAR {(booking.totalPrice ?? 0).toFixed(2)}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          SAR {(booking.pricePerNight ?? 0).toFixed(2)} per
                          night
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
                        WhatsApp team
                      </button>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelTarget(booking);
                            setCancellationReason("");
                          }}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel booking
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
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.25)] sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-rental-booking-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F45A2A]">
                  Rental booking
                </p>

                <h2
                  id="cancel-rental-booking-title"
                  className="mt-1 text-lg font-bold"
                >
                  <span className="text-[#173C82]">Cancel </span>
                  <span className="text-[#F45A2A]">Booking</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeCancelDialog}
                disabled={Boolean(cancellingId)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close cancellation dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-[#F8FAFE] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Selected stay
              </p>

              <p className="mt-1 text-sm font-bold text-[#173C82]">
                {cancelTarget.apartment?.title?.en || "Rental Apartment"}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {cancelTarget.checkInDate} to {cancelTarget.checkOutDate}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Cancellation reason{" "}
                <span className="font-medium text-slate-400">(optional)</span>
              </label>

              <textarea
                rows={4}
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Tell us why you would like to cancel this stay booking..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelDialog}
                disabled={Boolean(cancellingId)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep booking
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

                {cancellingId ? "Cancelling..." : "Confirm cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};