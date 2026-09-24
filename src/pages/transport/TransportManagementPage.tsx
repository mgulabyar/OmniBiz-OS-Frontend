import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  transportService,
  type VehicleItem,
  type VehicleType,
} from "../../services/transport/transportService";

const vehicleTypes: VehicleType[] = [
  "Sedan",
  "SUV",
  "Luxury Bus",
  "Mini Van",
  "Coaster",
];

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

const createInitialForm = () => ({
  nameEn: "",
  nameAr: "",
  vehicleType: "SUV" as VehicleType,
  capacity: "7",
  pricePerDay: "600",
  descriptionEn: "",
  descriptionAr: "",
  imagesText: "",
  featuresText: "",
  hasAirConditioning: true,
  luggageCapacity: "0",
  isAvailable: true,
});

const getSafeNumber = (value: unknown, fallback = 0) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const TransportManagementPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleItem | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [form, setForm] = useState(createInitialForm);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadVehicles = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await transportService.getVehicles();
      setVehicles(response.data.vehicles);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the fleet directory.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadVehicles();
  }, []);

  const vehicleCountLabel = useMemo(() => {
    return `${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""}`;
  }, [vehicles.length]);

  const resetForm = () => {
    if (submitting) {
      return;
    }

    setEditingId(null);
    setForm(createInitialForm());
  };

  const handleEditClick = (vehicle: VehicleItem) => {
    setEditingId(vehicle._id);

    setForm({
      nameEn: vehicle.name.en || "",
      nameAr: vehicle.name.ar || "",
      vehicleType: vehicle.vehicleType,
      capacity: String(getSafeNumber(vehicle.capacity, 1)),
      pricePerDay: String(getSafeNumber(vehicle.pricePerDay, 0)),
      descriptionEn: vehicle.description?.en || "",
      descriptionAr: vehicle.description?.ar || "",
      imagesText: vehicle.images?.join("\n") || "",
      featuresText: vehicle.features?.join(", ") || "",
      hasAirConditioning: Boolean(vehicle.hasAirConditioning),
      luggageCapacity: String(getSafeNumber(vehicle.luggageCapacity, 0)),
      isAvailable: Boolean(vehicle.isAvailable),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const capacity = getSafeNumber(form.capacity, 0);
    const pricePerDay = getSafeNumber(form.pricePerDay, -1);
    const luggageCapacity = getSafeNumber(form.luggageCapacity, -1);

    if (!form.nameEn.trim() || !form.nameAr.trim()) {
      showToast(
        "error",
        "Please enter the vehicle name in English and Arabic.",
      );
      return;
    }

    if (capacity < 1 || pricePerDay < 0 || luggageCapacity < 0) {
      showToast(
        "error",
        "Please enter valid capacity, daily rate and luggage capacity.",
      );
      return;
    }

    const payload = {
      name: {
        en: form.nameEn.trim(),
        ar: form.nameAr.trim(),
      },
      vehicleType: form.vehicleType,
      capacity,
      pricePerDay,
      description: {
        en: form.descriptionEn.trim(),
        ar: form.descriptionAr.trim(),
      },
      images: form.imagesText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      features: form.featuresText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      hasAirConditioning: form.hasAirConditioning,
      luggageCapacity,
      isAvailable: form.isAvailable,
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await transportService.updateVehicle(editingId, payload);
        showToast("success", "Vehicle details updated successfully.");
      } else {
        await transportService.addVehicle(payload);
        showToast("success", "New vehicle added to the active fleet.");
      }

      setEditingId(null);
      setForm(createInitialForm());
      await loadVehicles(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to save vehicle information.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeDeleteDialog = () => {
    if (deletingId) {
      return;
    }

    setDeleteTarget(null);
  };

  const handleDeleteVehicle = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletingId(deleteTarget._id);

    try {
      await transportService.deleteVehicle(deleteTarget._id);

      if (editingId === deleteTarget._id) {
        setEditingId(null);
        setForm(createInitialForm());
      }

      showToast("success", "Vehicle removed from public fleet availability.");
      setDeleteTarget(null);
      await loadVehicles(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove this vehicle.",
      );
    } finally {
      setDeletingId(null);
    }
  };

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
            <Truck className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Transport</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Fleet <span className="text-[#F45A2A]">Management</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Add fleet vehicles, update transport details and control which
            vehicles are available for public inquiries.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Fleet Directory
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {vehicleCountLabel} currently listed in the fleet.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadVehicles(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh fleet"
          aria-label="Refresh fleet"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-[#173C82]">
                <Truck className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {editingId ? "Update Vehicle" : "New Vehicle"}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                {editingId ? (
                  <>
                    Edit <span className="text-[#F45A2A]">Fleet Unit</span>
                  </>
                ) : (
                  <>
                    Add <span className="text-[#F45A2A]">Fleet Unit</span>
                  </>
                )}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
                aria-label="Cancel vehicle edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Vehicle Name — English
              </label>

              <input
                type="text"
                value={form.nameEn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameEn: event.target.value,
                  }))
                }
                placeholder="e.g. Toyota Hiace 2025"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Vehicle Name — Arabic
              </label>

              <input
                type="text"
                dir="rtl"
                value={form.nameAr}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameAr: event.target.value,
                  }))
                }
                placeholder="اسم المركبة بالعربية"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Vehicle Type
              </label>

              <select
                value={form.vehicleType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    vehicleType: event.target.value as VehicleType,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              >
                {vehicleTypes.map((vehicleType) => (
                  <option key={vehicleType} value={vehicleType}>
                    {vehicleType}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Capacity
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      capacity: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Daily Rate (SAR)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pricePerDay}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pricePerDay: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Luggage Capacity
              </label>

              <input
                type="number"
                min="0"
                value={form.luggageCapacity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    luggageCapacity: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Description — English
              </label>

              <textarea
                rows={3}
                value={form.descriptionEn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descriptionEn: event.target.value,
                  }))
                }
                placeholder="Short vehicle description"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Description — Arabic
              </label>

              <textarea
                rows={3}
                dir="rtl"
                value={form.descriptionAr}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descriptionAr: event.target.value,
                  }))
                }
                placeholder="وصف مختصر للمركبة"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Image URLs{" "}
                <span className="font-medium text-slate-400">
                  (one per line)
                </span>
              </label>

              <textarea
                rows={3}
                value={form.imagesText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    imagesText: event.target.value,
                  }))
                }
                placeholder="https://example.com/vehicle-image.jpg"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Features{" "}
                <span className="font-medium text-slate-400">
                  (comma separated)
                </span>
              </label>

              <input
                type="text"
                value={form.featuresText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    featuresText: event.target.value,
                  }))
                }
                placeholder="Wi-Fi, Leather seats, Water bottles"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div className="space-y-2 rounded-lg bg-slate-50 p-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs font-bold text-slate-700">
                Air Conditioning Available
                <input
                  type="checkbox"
                  checked={form.hasAirConditioning}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      hasAirConditioning: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#173C82]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs font-bold text-slate-700">
                Available for New Inquiries
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isAvailable: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#173C82]"
                />
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#173C82] px-4 text-sm font-bold text-white transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <PencilLine className="h-4 w-4 text-[#F45A2A]" />
                ) : (
                  <Plus className="h-4 w-4 text-[#F45A2A]" />
                )}

                {editingId ? "Save Changes" : "Add Vehicle"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="h-11 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-[#173C82]">
                <Truck className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Fleet Directory
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                Available <span className="text-[#F45A2A]">Vehicles</span>
              </h2>
            </div>

            <span className="rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-xs font-bold text-[#173C82]">
              {vehicleCountLabel}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Truck className="mx-auto h-7 w-7 text-[#173C82]/25" />

              <p className="mt-3 text-sm font-medium text-slate-500">
                No fleet vehicles have been added yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vehicles.map((vehicle) => {
                const capacity = getSafeNumber(vehicle.capacity, 0);
                const pricePerDay = getSafeNumber(vehicle.pricePerDay, 0);

                return (
                  <article
                    key={vehicle._id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-[#173C82]">
                          {vehicle.name.en}
                        </h3>

                        <span className="rounded-md bg-[#F4F7FC] px-2 py-1 text-[10px] font-bold text-[#173C82]">
                          {vehicle.vehicleType}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                            vehicle.isAvailable
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {vehicle.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      {vehicle.name.ar && (
                        <p
                          dir="rtl"
                          className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                        >
                          {vehicle.name.ar}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span>Capacity: {capacity} passengers</span>
                        <span>Rate: SAR {pricePerDay.toFixed(2)} / day</span>
                        <span>
                          Luggage: {getSafeNumber(vehicle.luggageCapacity, 0)}{" "}
                          bags
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(vehicle)}
                        disabled={submitting || Boolean(deletingId)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-60"
                        title="Edit vehicle"
                        aria-label={`Edit ${vehicle.name.en}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(vehicle)}
                        disabled={submitting || Boolean(deletingId)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Remove vehicle"
                        aria-label={`Remove ${vehicle.name.en}`}
                      >
                        {deletingId === vehicle._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteDialog();
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.25)] sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-vehicle-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#173C82]">
                  <Truck className="h-4 w-4 text-[#F45A2A]" />

                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    OmniBiz <span className="text-[#F45A2A]">Transport</span>
                  </span>
                </div>

                <h2
                  id="remove-vehicle-title"
                  className="mt-3 text-xl font-bold tracking-tight text-[#173C82]"
                >
                  Remove <span className="text-[#F45A2A]">Vehicle</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
                aria-label="Close vehicle removal dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Selected Vehicle
              </p>

              <p className="mt-1 text-sm font-bold text-[#173C82]">
                {deleteTarget.name.en}
              </p>

              {deleteTarget.name.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {deleteTarget.name.ar}
                </p>
              )}

              <p className="mt-2 text-xs font-medium text-slate-500">
                {deleteTarget.vehicleType} ·{" "}
                {getSafeNumber(deleteTarget.capacity, 0)} passengers · SAR{" "}
                {getSafeNumber(deleteTarget.pricePerDay, 0).toFixed(2)} / day
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-700">
                This action will remove the vehicle from public fleet
                availability.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                Existing transport inquiries will not be deleted, but customers
                will no longer be able to submit new requests for this vehicle.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Vehicle
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteVehicle()}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                {deletingId ? "Removing..." : "Remove Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
