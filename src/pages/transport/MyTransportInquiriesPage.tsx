import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Route,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import {
  transportService,
  type InquiryStatus,
  type TransportInquiryItem,
} from "../../services/transport/transportService";

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

const statusConfig: Record<
  InquiryStatus,
  {
    label: string;
    className: string;
  }
> = {
  Pending: {
    label: "Awaiting Review",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  Reviewed: {
    label: "Under Review",
    className: "border-[#DCE7FA] bg-[#F4F7FC] text-[#173C82]",
  },
  Approved: {
    label: "Approved",
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
};

const getTripTypeLabel = (tripType: TransportInquiryItem["tripType"]) => {
  const labels: Record<TransportInquiryItem["tripType"], string> = {
    OneWay: "One Way",
    RoundTrip: "Round Trip",
    DailyRental: "Daily Rental",
  };

  return labels[tripType];
};

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const MyTransportInquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<TransportInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] =
    useState<TransportInquiryItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadInquiries = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await transportService.getAllInquiries();

      if (response.status === "success") {
        setInquiries(response.data.inquiries ?? []);
      }
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load transport inquiries.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadInquiries();
  }, []);

  const inquiryCountLabel = useMemo(() => {
    return `${inquiries.length} transport ${
      inquiries.length === 1 ? "inquiry" : "inquiries"
    }`;
  }, [inquiries.length]);

  const openCancelDialog = (inquiry: TransportInquiryItem) => {
    setCancelTarget(inquiry);
    setCancellationReason("");
  };

  const closeCancelDialog = () => {
    if (cancellingId) {
      return;
    }

    setCancelTarget(null);
    setCancellationReason("");
  };

  const handleCancelInquiry = async () => {
    if (!cancelTarget) {
      return;
    }

    setCancellingId(cancelTarget._id);

    try {
      const response = await transportService.cancelMyInquiry(
        cancelTarget._id,
        cancellationReason.trim() || undefined,
      );

      if (response.status === "success") {
        showToast("success", "Your transport inquiry has been cancelled.");
        setCancelTarget(null);
        setCancellationReason("");
        await loadInquiries(true);
      }
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel this inquiry.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const openWhatsApp = (inquiry: TransportInquiryItem) => {
    if (inquiry.customerWhatsAppUrl) {
      window.open(
        inquiry.customerWhatsAppUrl,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    const message = `Salam! I need assistance with my transport inquiry.\nReference: ${
      inquiry._id
    }\nVehicle: ${
      inquiry.vehicle?.name?.en || "Transport vehicle"
    }\nRoute: ${inquiry.pickupLocation || "Not specified"} to ${
      inquiry.dropoffLocation || "Not specified"
    }\nDates: ${inquiry.startDate || "Not specified"} to ${
      inquiry.endDate || "Not specified"
    }`;

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
            Loading transport inquiries...
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
            <Route className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Transport</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            My Transport <span className="text-[#F45A2A]">Inquiries</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Track your route requests, manage active inquiries and review
            transport quotations.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Inquiry History
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {inquiryCountLabel} found.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadInquiries(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh transport inquiries"
          aria-label="Refresh transport inquiries"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {inquiries.length === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <Route className="h-6 w-6 text-[#173C82]" />
          </div>

          <h2 className="mt-4 text-lg font-bold">
            <span className="text-[#173C82]">No Transport </span>
            <span className="text-[#F45A2A]">Inquiries Yet</span>
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Submit a transport request from the fleet page and its progress will
            appear here.
          </p>
        </section>
      ) : (
        <section className="mt-8 space-y-4">
          {inquiries.map((inquiry) => {
            const status = statusConfig[inquiry.status] || statusConfig.Pending;

            const canCancel =
              inquiry.status === "Pending" || inquiry.status === "Reviewed";

            const quotedAmount =
              inquiry.quotedAmount !== null &&
              inquiry.quotedAmount !== undefined
                ? getSafeNumber(inquiry.quotedAmount, 0)
                : null;

            const passengerCount = Math.max(
              1,
              getSafeNumber(inquiry.passengers, 1),
            );

            return (
              <article
                key={inquiry._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#173C82]/20 hover:shadow-[0_10px_24px_rgba(23,60,130,0.08)]"
              >
                <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#F45A2A]">
                          {getTripTypeLabel(inquiry.tripType)}
                        </p>

                        <h2 className="mt-1 truncate text-base font-bold text-[#173C82]">
                          {inquiry.vehicle?.name?.en || "Transport Vehicle"}
                        </h2>

                        {inquiry.vehicle?.name?.ar && (
                          <p
                            dir="rtl"
                            className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                          >
                            {inquiry.vehicle.name.ar}
                          </p>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-slate-400">
                        Ref. {inquiry._id.slice(-8).toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-[#F4F7FC] p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#173C82]/65">
                          <MapPin className="h-3.5 w-3.5 text-[#173C82]" />
                          Pickup Location
                        </div>

                        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                          {inquiry.pickupLocation || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#FFF8F5] p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#D9481D]/70">
                          <MapPin className="h-3.5 w-3.5 text-[#F45A2A]" />
                          Destination
                        </div>

                        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                          {inquiry.dropoffLocation || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5 text-[#173C82]" />
                          Travel Dates
                        </div>

                        <p className="mt-2 text-xs font-bold text-slate-700">
                          {inquiry.startDate || "Not specified"}
                        </p>

                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          to {inquiry.endDate || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <UsersRound className="h-3.5 w-3.5 text-[#F45A2A]" />
                          Passengers
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {passengerCount}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <Clock3 className="h-3.5 w-3.5 text-[#173C82]" />
                          Pickup Time
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {inquiry.pickupTime || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {inquiry.adminResponse && (
                      <div className="mt-4 rounded-lg bg-[#F4F7FC] p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#173C82]/65">
                          Transport Team Response
                        </p>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {inquiry.adminResponse}
                        </p>
                      </div>
                    )}

                    {inquiry.status === "Cancelled" &&
                      inquiry.cancellationReason && (
                        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                            Cancellation Reason
                          </p>

                          <p className="mt-1 text-xs font-medium text-red-700">
                            {inquiry.cancellationReason}
                          </p>
                        </div>
                      )}
                  </div>

                  <aside className="flex flex-col justify-between rounded-lg bg-slate-50 p-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Inquiry Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-md border px-2.5 py-1.5 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>

                      <div className="mt-5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Quotation
                        </p>

                        {quotedAmount !== null ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#173C82]">
                            <CircleDollarSign className="h-5 w-5 text-[#F45A2A]" />
                            SAR {quotedAmount.toFixed(2)}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm font-bold text-amber-700">
                            Awaiting Quote
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <button
                        type="button"
                        onClick={() => openWhatsApp(inquiry)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-3 text-xs font-bold text-white transition hover:bg-[#102D63]"
                      >
                        <MessageCircle className="h-4 w-4 text-[#F45A2A]" />
                        WhatsApp
                      </button>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => openCancelDialog(inquiry)}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel Inquiry
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
            aria-labelledby="cancel-inquiry-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#173C82]">
                  <Route className="h-4 w-4 text-[#F45A2A]" />

                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    OmniBiz <span className="text-[#F45A2A]">Transport</span>
                  </span>
                </div>

                <h2
                  id="cancel-inquiry-title"
                  className="mt-3 text-xl font-bold tracking-tight text-[#173C82]"
                >
                  Cancel <span className="text-[#F45A2A]">Inquiry</span>
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
                Selected Transport Request
              </p>

              <p className="mt-1 text-sm font-bold text-[#173C82]">
                {cancelTarget.vehicle?.name?.en || "Transport Vehicle"}
              </p>

              {cancelTarget.vehicle?.name?.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {cancelTarget.vehicle.name.ar}
                </p>
              )}

              <p className="mt-2 text-xs font-medium text-slate-500">
                {cancelTarget.pickupLocation || "Not specified"} to{" "}
                {cancelTarget.dropoffLocation || "Not specified"}
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
                placeholder="Tell us why you would like to cancel this inquiry..."
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
                Keep Inquiry
              </button>

              <button
                type="button"
                onClick={() => void handleCancelInquiry()}
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