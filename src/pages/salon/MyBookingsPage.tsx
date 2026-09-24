import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Scissors,
  X,
  XCircle,
} from "lucide-react";
import {
  salonService,
  type BookingItem,
  type BookingStatus,
} from "../../services/salon/salonService";

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

const getStatusClasses = (status: BookingStatus) => {
  const classes: Record<BookingStatus, string> = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Cancelled: "border-red-200 bg-red-50 text-red-700",
    Completed: "border-[#DCE7FA] bg-[#F4F7FC] text-[#173C82]",
  };

  return classes[status];
};

const getPaymentClasses = (status: BookingItem["paymentStatus"]) => {
  const classes: Record<BookingItem["paymentStatus"], string> = {
    Pending: "text-amber-700",
    Paid: "text-emerald-700",
    Failed: "text-red-700",
    Refunded: "text-[#173C82]",
  };

  return classes[status];
};

const getSafeAmount = (amount: unknown) => {
  const numericAmount = Number(amount);

  return Number.isFinite(numericAmount) ? numericAmount : 0;
};

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchUserBookings = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await salonService.getBookings();

      if (result.status === "success") {
        setBookings(result.data.bookings);
      }
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your salon bookings.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchUserBookings();
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
      const result = await salonService.cancelMyBooking(
        cancelTarget._id,
        cancellationReason.trim() || undefined,
      );

      if (result.status === "success") {
        showToast("success", "Your appointment has been cancelled.");
        setCancelTarget(null);
        setCancellationReason("");
        await fetchUserBookings(true);
      }
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel this appointment.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const openWhatsAppMessage = (booking: BookingItem) => {
    const backendUrl =
      booking.reminderWhatsAppUrl || booking.confirmationWhatsAppUrl;

    if (backendUrl) {
      window.open(backendUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const message = `Salam! I need assistance with my salon booking.\nBooking ID: ${booking._id}\nService: ${booking.service?.name?.en || "Salon service"}\nDate: ${booking.bookingDate}\nTime: ${booking.timeSlot}`;

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
          <span className="text-sm font-semibold text-slate-500">
            Loading your appointments...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
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
            <Scissors className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Salon</span>
            </span>
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            My <span className="text-[#F45A2A]">Appointments</span>
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Review, track and manage your salon appointment bookings.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Appointment History
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {bookings.length} appointment
            {bookings.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchUserBookings(true)}
          disabled={refreshing}
          className="inline-flex items-center rounded-md justify-center bg-[#173C82] p-2 text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh appointments"
          aria-label="Refresh appointments"
        >
          <RefreshCw
            className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <CalendarDays className="h-6 w-6 text-[#173C82]" />
          </div>

          <h3 className="mt-4 text-lg font-bold text-[#173C82]">
            No appointments found
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Your salon appointments will appear here after you complete a
            booking.
          </p>
        </div>
      ) : (
        <section className="mt-8 space-y-4">
          {bookings.map((booking) => {
            const canCancel =
              booking.bookingStatus === "Pending" ||
              booking.bookingStatus === "Confirmed";

            const isCancelling = cancellingId === booking._id;
            const totalAmount = getSafeAmount(booking.totalAmount);

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
                          Salon Appointment
                        </p>

                        <h3 className="mt-1 truncate text-base font-bold text-[#173C82]">
                          {booking.service?.name?.en || "Salon Service"}
                        </h3>

                        {booking.service?.name?.ar && (
                          <p
                            dir="rtl"
                            className="mt-1 text-right text-xs font-semibold text-slate-500"
                          >
                            {booking.service.name.ar}
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
                          Date
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {booking.bookingDate}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#FFF8F5] p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#D9481D]/70">
                          <Clock3 className="h-3.5 w-3.5 text-[#F45A2A]" />
                          Time
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {booking.timeSlot}
                          {booking.endTime ? ` - ${booking.endTime}` : ""}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <Scissors className="h-3.5 w-3.5 text-[#173C82]" />
                          Beautician
                        </div>

                        <p className="mt-2 truncate text-sm font-bold text-slate-700">
                          {booking.staff?.name || "To be assigned"}
                        </p>
                      </div>
                    </div>

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
                        Appointment Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-md border px-2.5 py-1.5 text-xs font-bold ${getStatusClasses(
                          booking.bookingStatus,
                        )}`}
                      >
                        {booking.bookingStatus}
                      </span>

                      <div className="mt-5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Payment
                        </p>

                        <p className="mt-1 text-xl font-bold text-[#173C82]">
                          SAR {totalAmount.toFixed(2)}
                        </p>

                        <p
                          className={`mt-1 text-xs font-bold ${getPaymentClasses(
                            booking.paymentStatus,
                          )}`}
                        >
                          {booking.paymentStatus}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <button
                        type="button"
                        onClick={() => openWhatsAppMessage(booking)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-3 text-xs font-bold text-white transition hover:bg-[#102D63]"
                      >
                        <MessageCircle className="h-4 w-4 text-[#F45A2A]" />
                        WhatsApp
                      </button>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelTarget(booking);
                            setCancellationReason("");
                          }}
                          disabled={isCancelling}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Cancel appointment
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
            aria-labelledby="cancel-appointment-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#173C82]">
                  <Scissors className="h-4 w-4 text-[#F45A2A]" />

                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    OmniBiz <span className="text-[#F45A2A]">Salon</span>
                  </span>
                </div>

                <h2
                  id="cancel-appointment-title"
                  className="mt-3 text-xl font-bold tracking-tight text-[#173C82]"
                >
                  Cancel <span className="text-[#F45A2A]">Appointment</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeCancelDialog}
                disabled={Boolean(cancellingId)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition-colors hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
                aria-label="Close cancellation dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Selected appointment
              </p>

              <p className="mt-1 text-sm font-bold text-[#173C82]">
                {cancelTarget.service?.name?.en || "Salon Service"}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {cancelTarget.bookingDate} · {cancelTarget.timeSlot}
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
                placeholder="Tell us why you would like to cancel this appointment..."
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
                Keep appointment
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
    </div>
  );
};
