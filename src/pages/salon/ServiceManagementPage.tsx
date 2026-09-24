import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
import {
  salonService,
  type SalonCategory,
  type SalonServiceItem,
} from "../../services/salon/salonService";

const categories: SalonCategory[] = [
  "Hair",
  "Nails",
  "Skin",
  "Makeup",
  "Massage",
];

const createInitialForm = () => ({
  nameEn: "",
  nameAr: "",
  category: "Hair" as SalonCategory,
  price: "",
  discountedPrice: "",
  durationMinutes: "45",
  descriptionEn: "",
  descriptionAr: "",
});

export const ServiceManagementPage: React.FC = () => {
  const [services, setServices] = useState<SalonServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(createInitialForm);

  const loadServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await salonService.getServices();

      if (result.status === "success") {
        setServices(result.data.services);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load salon services.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
  };

  const handleEditClick = (service: SalonServiceItem) => {
    setError(null);
    setSuccess(null);
    setEditingId(service._id);

    setForm({
      nameEn: service.name.en,
      nameAr: service.name.ar,
      category: service.category,
      price: String(service.price),
      discountedPrice:
        service.discountedPrice !== null ? String(service.discountedPrice) : "",
      durationMinutes: String(service.durationMinutes),
      descriptionEn: service.description?.en || "",
      descriptionAr: service.description?.ar || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const price = Number(form.price);
    const discountedPrice = form.discountedPrice
      ? Number(form.discountedPrice)
      : null;
    const durationMinutes = Number(form.durationMinutes);

    if (price < 0 || durationMinutes < 5) {
      setError(
        "Please enter a valid price and duration of at least 5 minutes.",
      );
      return;
    }

    if (discountedPrice !== null && discountedPrice > price) {
      setError("Discounted price cannot be greater than regular price.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: {
        en: form.nameEn.trim(),
        ar: form.nameAr.trim(),
      },
      category: form.category,
      price,
      discountedPrice,
      durationMinutes,
      description: {
        en: form.descriptionEn.trim(),
        ar: form.descriptionAr.trim(),
      },
    };

    try {
      if (editingId) {
        await salonService.updateService(editingId, payload);
        setSuccess("Salon service updated successfully.");
      } else {
        await salonService.addService(payload);
        setSuccess("New salon service created successfully.");
      }

      resetForm();
      await loadServices();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the service.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (service: SalonServiceItem) => {
    const confirmed = window.confirm(
      `Delete "${service.name.en}" from the salon catalogue?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(service._id);
    setError(null);
    setSuccess(null);

    try {
      await salonService.deleteService(service._id);
      setSuccess("Salon service deleted successfully.");

      if (editingId === service._id) {
        resetForm();
      }

      await loadServices();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this service.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#173C82]">
            <Scissors className="h-4 w-4 text-[#F45A2A]" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Salon
              <span className="text-[#F45A2A]"> Administration</span>
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Service <span className="text-[#F45A4D]">Management</span>
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create and maintain salon services, pricing and appointment
            duration.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadServices()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#173C82]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#173C82] transition hover:border-[#173C82]/35 hover:bg-[#F4F7FC] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh list
        </button>
      </div>

      {success && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#F45A2A]">
                {editingId ? "Edit Service" : "New Service"}
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                {editingId ? "Update service details" : "Add salon service"}
              </h3>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cancel service edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Service Name - English
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
                placeholder="e.g. Haircut & Blow Dry"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Service Name - Arabic
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
                placeholder="اسم الخدمة بالعربية"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-right text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div className="relative">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Category
              </label>

              <div className="relative">
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as SalonCategory,
                    }))
                  }
                  className="w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-10 py-2 text-sm font-medium text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://w3.org"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Price (SAR)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Duration (min)
                </label>

                <input
                  type="number"
                  min="5"
                  step="5"
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationMinutes: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Discounted price (optional)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discountedPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discountedPrice: event.target.value,
                  }))
                }
                placeholder="Leave empty for regular price"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Description - English
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
                placeholder="Short service description"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Description - Arabic
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
                placeholder="وصف مختصر للخدمة"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-right text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#173C82] py-2.5 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(23,60,130,0.18)] transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#F45A2A]" />
                ) : editingId ? (
                  <PencilLine className="h-4 w-4 text-[#F45A2A]" />
                ) : (
                  <Plus className="h-4 w-4 text-[#F45A2A]" />
                )}

                {editingId ? "Save changes" : "Create service"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_16px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#F45A2A]">
                Live Catalogue
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                Active salon services
              </h3>
            </div>

            <span className="rounded-full bg-[#F4F7FC] px-3 py-1.5 text-xs font-bold text-[#173C82]">
              {services.length} services
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : services.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                No salon services have been created yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {services.map((service) => {
                const hasDiscount =
                  service.discountedPrice !== null &&
                  service.discountedPrice < service.price;

                return (
                  <div
                    key={service._id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-bold text-slate-800">
                          {service.name.en}
                        </h4>

                        <span className="rounded-md bg-[#F4F7FC] px-2 py-1 text-[10px] font-bold text-[#173C82]">
                          {service.category}
                        </span>
                      </div>

                      <p
                        dir="rtl"
                        className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                      >
                        {service.name.ar}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span>{service.durationMinutes} minutes</span>
                        <span>Regular: SAR {service.price.toFixed(2)}</span>

                        {hasDiscount && (
                          <span className="font-bold text-[#F45A2A]">
                            Offer: SAR {service.discountedPrice?.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(service)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC]"
                        title="Edit service"
                        aria-label={`Edit ${service.name.en}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteClick(service)}
                        disabled={deletingId === service._id}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Delete service"
                        aria-label={`Delete ${service.name.en}`}
                      >
                        {deletingId === service._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
