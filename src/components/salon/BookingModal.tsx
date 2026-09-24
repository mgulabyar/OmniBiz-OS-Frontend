import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  UserRound,
  X,
} from "lucide-react";
import {
  salonService,
  type AvailableSlot,
  type PaymentMethod,
  type SalonServiceItem,
  type StaffItem,
} from "../../services/salon/salonService";

interface BookingModalProps {
  service: SalonServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: (
    bookingId: string,
    amount: number,
    serviceName: string,
  ) => void;
}

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

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-SA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const BookingModal: React.FC<BookingModalProps> = ({
  service,
  isOpen,
  onClose,
  onProceedToPayment,
}) => {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Mada");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableStaff = useMemo(() => {
    if (!service) return [];

    return staffList.filter((staff) =>
      staff.speciality.some((speciality) => speciality._id === service._id),
    );
  }, [service, staffList]);

  const finalAmount = useMemo(() => {
    if (!service) return 0;

    return service.discountedPrice ?? service.price;
  }, [service]);

  const resetForm = () => {
    setSelectedStaff("");
    setBookingDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
    setPaymentMethod("Mada");
    setError(null);
    setIsLoadingSlots(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadStaff = async () => {
      setIsLoadingStaff(true);
      setError(null);

      try {
        const response = await salonService.getAllStaff();
        setStaffList(response.data.staff);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load salon staff. Please try again.",
        );
      } finally {
        setIsLoadingStaff(false);
      }
    };

    void loadStaff();
  }, [isOpen]);

  useEffect(() => {
    setSelectedStaff("");
    setBookingDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
  }, [service?._id]);

  useEffect(() => {
    setSelectedSlot("");
    setAvailableSlots([]);
    setError(null);

    if (!selectedStaff || !bookingDate || !service) {
      return;
    }

    const loadAvailableSlots = async () => {
      setIsLoadingSlots(true);

      try {
        const response = await salonService.getAvailableSlots(
          selectedStaff,
          service._id,
          bookingDate,
        );

        setAvailableSlots(response.data.slots);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load available time slots.",
        );
      } finally {
        setIsLoadingSlots(false);
      }
    };

    void loadAvailableSlots();
  }, [selectedStaff, bookingDate, service]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!isOpen || !service) {
    return null;
  }

  const handleBookingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedStaff || !bookingDate || !selectedSlot) {
      setError("Please select a beautician, appointment date and time slot.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await salonService.createBooking({
        staff: selectedStaff,
        service: service._id,
        bookingDate,
        timeSlot: selectedSlot,
        paymentMethod,
      });

      onProceedToPayment(
        response.data.booking._id,
        response.data.booking.totalAmount,
        service.name.en,
      );

      resetForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create your booking. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="flex items-start justify-between border-b border-slate-100 bg-[#F8FAFE] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#F45A2A]">
              Salon Appointment
            </p>

            <h3
              id="booking-modal-title"
              className="mt-1 truncate text-md font-bold text-[#173C82]"
            >
              Book {service.name.en}
            </h3>

            <p
              dir="rtl"
              className="mt-0.5 text-right text-xs font-medium text-slate-500"
            >
              {service.name.ar}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition hover:border-[#F45A2A]/30 hover:bg-[#FFF4F0] hover:text-[#F45A2A] focus:outline-none focus:ring-2 focus:ring-[#F45A2A]/20"
            aria-label="Close booking modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleBookingSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#DCE7FA] bg-[#F4F7FC] p-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Duration
              </p>

              <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#173C82]">
                <Clock3 className="h-4 w-4 text-[#F45A2A]" />
                {service.durationMinutes} minutes
              </div>
            </div>

            <div className="border-l border-[#DCE7FA] pl-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Total Amount
              </p>

              <p className="mt-1 text-md font-bold text-[#173C82]">
                SAR {finalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Select Beautician
            </label>

            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

              <select
                value={selectedStaff}
                onChange={(event) => setSelectedStaff(event.target.value)}
                disabled={isLoadingStaff || availableStaff.length === 0}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                required
              >
                <option value="">
                  {isLoadingStaff
                    ? "Loading salon team..."
                    : availableStaff.length === 0
                      ? "No beautician is assigned to this service"
                      : "Choose a beautician"}
                </option>

                {availableStaff.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Appointment Date
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

              <input
                type="date"
                value={bookingDate}
                min={getTodaySaudiDate()}
                onChange={(event) => setBookingDate(event.target.value)}
                disabled={!selectedStaff}
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                required
              />
            </div>
          </div>

          {selectedStaff && bookingDate && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-slate-700">
                  Available Time
                </label>

                {isLoadingSlots && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#173C82]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F45A2A]" />
                    Checking availability
                  </span>
                )}
              </div>

              {!isLoadingSlots && availableSlots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs font-medium text-slate-500">
                  No available time slots for this date. Please choose another
                  date.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.startTime;

                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startTime)}
                        className={`rounded-lg border px-3 py-2.5 text-center text-xs font-bold transition ${
                          isSelected
                            ? "border-[#173C82] bg-[#173C82] text-white shadow-[0_4px_10px_rgba(23,60,130,0.18)]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/50 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
                        }`}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Payment Method
            </label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["Mada", "Visa", "ApplePay", "Cash"] as PaymentMethod[]).map(
                (method) => {
                  const isSelected = paymentMethod === method;

                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-md border px-1.5 py-2 text-xs font-bold transition ${
                        isSelected
                          ? "border-[#F45A2A] bg-[#FFF4F0] text-[#D9481D]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5]"
                      }`}
                    >
                      {method === "ApplePay" ? "Apple Pay" : method}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={
              !selectedStaff ||
              !bookingDate ||
              !selectedSlot ||
              isSubmitting ||
              isLoadingSlots
            }
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#173C82] py-3 text-sm font-bold text-white shadow-[0_7px_16px_rgba(23,60,130,0.20)] transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

            <span>
              {isSubmitting
                ? "Creating your booking..."
                : paymentMethod === "Cash"
                  ? "Confirm Cash Booking"
                  : "Continue to Payment"}
            </span>
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#F45A2A]" />
            Your selected time is validated before booking confirmation.
          </p>
        </form>
      </div>
    </div>
  );
};
