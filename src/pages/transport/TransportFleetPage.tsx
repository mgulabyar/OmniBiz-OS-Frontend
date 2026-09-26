import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  UsersRound,
  X,
} from "lucide-react";
import {
  transportService,
  type CreateTransportInquiryPayload,
  type TripType,
  type VehicleItem,
  type VehicleType,
} from "../../services/transport/transportService";
import { VehicleCard } from "../../components/transport/VehicleCard";

const vehicleTypes: Array<{ value: VehicleType | ""; label: string }> = [
  { value: "", label: "All Vehicles" },
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "Mini Van", label: "Mini Van" },
  { value: "Coaster", label: "Coaster" },
  { value: "Luxury Bus", label: "Luxury Bus" },
];

const tripTypes: Array<{ value: TripType; label: string }> = [
  { value: "OneWay", label: "One Way" },
  { value: "RoundTrip", label: "Round Trip" },
  { value: "DailyRental", label: "Daily Rental" },
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

const createInitialInquiryForm = (): Omit<
  CreateTransportInquiryPayload,
  "vehicle"
> => ({
  tripType: "OneWay",
  pickupLocation: "",
  dropoffLocation: "",
  startDate: "",
  endDate: "",
  pickupTime: "",
  passengers: 1,
  notes: "",
});

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const TransportFleetPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [selectedType, setSelectedType] = useState<VehicleType | "">("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeVehicle, setActiveVehicle] = useState<VehicleItem | null>(null);
  const [form, setForm] = useState(createInitialInquiryForm);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    vehicleName: string;
    whatsappUrl: string | null;
    inquiryId: string;
  } | null>(null);

  const loadVehicles = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await transportService.getVehicles({
        type: selectedType || undefined,
      });

      setVehicles(response.data.vehicles ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the transport fleet.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadVehicles();
  }, [selectedType]);

  const selectedVehicleCapacity = useMemo(
    () => Math.max(1, getSafeNumber(activeVehicle?.capacity, 1)),
    [activeVehicle],
  );

  const selectedVehicleRate = useMemo(
    () => getSafeNumber(activeVehicle?.pricePerDay, 0),
    [activeVehicle],
  );

  const closeInquiryForm = () => {
    if (submitting) {
      return;
    }

    setActiveVehicle(null);
    setForm(createInitialInquiryForm());
    setError(null);
  };

  const openInquiryForm = (selectedVehicle: VehicleItem) => {
    setError(null);
    setForm(createInitialInquiryForm());
    setActiveVehicle(selectedVehicle);
  };

  const handleSubmitInquiry = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeVehicle || submitting) {
      return;
    }

    const pickupLocation = form.pickupLocation.trim();
    const dropoffLocation = form.dropoffLocation.trim();
    const passengerCount = getSafeNumber(form.passengers, 0);

    if (!pickupLocation || !dropoffLocation) {
      setError("Please enter both pickup and drop-off locations.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Please select both the start date and end date.");
      return;
    }

    if (form.endDate <= form.startDate) {
      setError("End date must be later than the start date.");
      return;
    }

    if (passengerCount < 1) {
      setError("Please enter at least one passenger.");
      return;
    }

    if (passengerCount > selectedVehicleCapacity) {
      setError(
        `This vehicle can accommodate up to ${selectedVehicleCapacity} passengers.`,
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const notesValue =
        typeof form.notes === "string" ? form.notes.trim() : "";

      const response = await transportService.submitInquiry({
        vehicle: activeVehicle._id,
        tripType: form.tripType,
        pickupLocation,
        dropoffLocation,
        startDate: form.startDate,
        endDate: form.endDate,
        pickupTime: form.pickupTime || null,
        passengers: passengerCount,
        notes: notesValue || null,
      });

      setSuccessData({
        vehicleName: activeVehicle.name?.en || "Transport Vehicle",
        whatsappUrl: response.data.customerWhatsAppUrl || null,
        inquiryId: response.data.inquiry._id,
      });

      setActiveVehicle(null);
      setForm(createInitialInquiryForm());
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit transport inquiry.",
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
            Loading transport fleet...
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
              <CarFront className="h-4 w-4 text-[#F45A2A]" />

              <span className="text-[11px] font-bold uppercase tracking-wide">
                OmniBiz <span className="text-[#F45A2A]">Transport</span>
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
              Inquiry <span className="text-[#F45A2A]">Submitted</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Your transport request has been received and is ready for review
              by the transport team.
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
            Request received successfully
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            Your inquiry for{" "}
            <span className="font-bold text-[#173C82]">
              {successData.vehicleName}
            </span>{" "}
            has been sent to the transport team. You will receive a route review
            and quotation shortly.
          </p>

          <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Inquiry Reference
            </p>

            <p className="mt-1 break-all text-sm font-bold text-[#173C82]">
              {successData.inquiryId}
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
              Return to Fleet
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
            <CarFront className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Transport</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Reliable Transport{" "}
            <span className="text-[#F45A2A]">For Every Journey</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Browse our professional fleet, provide your route details and
            receive a tailored quotation from the transport team.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Available Fleet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Choose a vehicle that matches your group and travel requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadVehicles(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center self-start rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60 lg:self-auto"
          title="Refresh fleet"
          aria-label="Refresh fleet"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {vehicleTypes.map((vehicleType) => {
          const isActive = selectedType === vehicleType.value;

          return (
            <button
              key={vehicleType.value || "all"}
              type="button"
              onClick={() => setSelectedType(vehicleType.value)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? "border-[#173C82] bg-[#173C82] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
              }`}
            >
              {vehicleType.label}
            </button>
          );
        })}
      </div>

      {error && !activeVehicle && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeVehicle ? (
        <section className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-start justify-between border-b border-slate-100 bg-[#F4F7FC] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#173C82]">
                <CarFront className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  OmniBiz <span className="text-[#F45A2A]">Transport</span>
                </span>
              </div>

              <h2 className="mt-2 truncate text-lg font-bold text-[#173C82]">
                Request{" "}
                <span className="text-[#F45A2A]">
                  {activeVehicle.name?.en || "Transport Vehicle"}
                </span>
              </h2>

              {activeVehicle.name?.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {activeVehicle.name.ar}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={closeInquiryForm}
              disabled={submitting}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
              aria-label="Close transport inquiry form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitInquiry} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-3 rounded-lg bg-[#F4F7FC] p-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Daily Rate
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  SAR {selectedVehicleRate.toFixed(2)}
                </p>
              </div>

              <div className="border-t border-[#DCE7FA] pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Capacity
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  {selectedVehicleCapacity} passengers
                </p>
              </div>

              <div className="border-t border-[#DCE7FA] pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Vehicle Type
                </p>

                <p className="mt-1 text-sm font-bold text-[#173C82]">
                  {activeVehicle.vehicleType}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Trip Type
              </label>

              <div className="grid grid-cols-3 gap-2">
                {tripTypes.map((tripType) => {
                  const isSelected = form.tripType === tripType.value;

                  return (
                    <button
                      key={tripType.value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          tripType: tripType.value,
                        }))
                      }
                      className={`rounded-md border px-2 py-2.5 text-xs font-bold transition ${
                        isSelected
                          ? "border-[#173C82] bg-[#173C82] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5]"
                      }`}
                    >
                      {tripType.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Pickup Location
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="text"
                    value={form.pickupLocation}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        pickupLocation: event.target.value,
                      }))
                    }
                    placeholder="e.g. Riyadh Airport"
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Drop-Off Location
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F45A2A]" />

                  <input
                    type="text"
                    value={form.dropoffLocation}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dropoffLocation: event.target.value,
                      }))
                    }
                    placeholder="e.g. Olaya District"
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Start Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="date"
                    value={form.startDate}
                    min={getTodaySaudiDate()}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                        endDate:
                          current.endDate &&
                          current.endDate <= event.target.value
                            ? ""
                            : current.endDate,
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  End Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F45A2A]" />

                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || getTodaySaudiDate()}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Pickup Time{" "}
                  <span className="font-medium text-slate-400">(optional)</span>
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="time"
                    value={form.pickupTime || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        pickupTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Passengers
                </label>

                <div className="relative">
                  <UsersRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="number"
                    min="1"
                    max={selectedVehicleCapacity}
                    value={form.passengers}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        passengers: getSafeNumber(event.target.value, 0),
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Additional Notes{" "}
                <span className="font-medium text-slate-400">(optional)</span>
              </label>

              <textarea
                rows={3}
                value={form.notes || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Luggage details, special pickup instructions or other requirements"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#173C82] px-4 text-sm font-semibold text-white transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CarFront className="h-4 w-4 text-[#F45A2A]" />
              )}

              {submitting
                ? "Submitting Inquiry..."
                : "Submit Transport Inquiry"}
            </button>
          </form>
        </section>
      ) : vehicles.length === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <CarFront className="h-6 w-6 text-[#173C82]" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#173C82]">
            No Vehicles Available
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            There are currently no active vehicles in this category. Try a
            different vehicle type or return later.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              onInquire={openInquiryForm}
            />
          ))}
        </section>
      )}
    </main>
  );
};
