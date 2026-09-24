import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Home,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  rentalService,
  type ApartmentItem,
  type PropertyType,
} from "../../services/rental/rentalService";

const propertyTypes: PropertyType[] = [
  "Apartment",
  "Studio",
  "Villa",
  "Room",
];

const createInitialForm = () => ({
  titleEn: "",
  titleAr: "",
  propertyType: "Apartment" as PropertyType,
  roomsCount: "2",
  maxGuests: "4",
  bedsCount: "2",
  bathroomsCount: "1",
  pricePerNight: "",
  cleaningFee: "0",
  googleMapUrl: "",
  locationName: "",
  descriptionEn: "",
  descriptionAr: "",
  imagesText: "",
  amenitiesEnText: "",
  amenitiesArText: "",
  isAvailable: true,
});

export const ApartmentManagementPage: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(createInitialForm);

  const loadApartments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await rentalService.getApartments();
      setApartments(response.data.apartments);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load apartment directory.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApartments();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
  };

  const handleEditClick = (apartment: ApartmentItem) => {
    setError(null);
    setSuccess(null);
    setEditingId(apartment._id);

    setForm({
      titleEn: apartment.title.en,
      titleAr: apartment.title.ar,
      propertyType: apartment.propertyType,
      roomsCount: String(apartment.roomsCount),
      maxGuests: String(apartment.maxGuests),
      bedsCount: String(apartment.bedsCount),
      bathroomsCount: String(apartment.bathroomsCount),
      pricePerNight: String(apartment.pricePerNight),
      cleaningFee: String(apartment.cleaningFee || 0),
      googleMapUrl: apartment.googleMapUrl,
      locationName: apartment.locationName || "",
      descriptionEn: apartment.description?.en || "",
      descriptionAr: apartment.description?.ar || "",
      imagesText: apartment.images?.join("\n") || "",
      amenitiesEnText: apartment.amenities.map((item) => item.en).join("\n"),
      amenitiesArText: apartment.amenities.map((item) => item.ar).join("\n"),
      isAvailable: apartment.isAvailable,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const roomsCount = Number(form.roomsCount);
    const maxGuests = Number(form.maxGuests);
    const bedsCount = Number(form.bedsCount);
    const bathroomsCount = Number(form.bathroomsCount);
    const pricePerNight = Number(form.pricePerNight);
    const cleaningFee = Number(form.cleaningFee);

    if (
      roomsCount < 1 ||
      maxGuests < 1 ||
      bedsCount < 1 ||
      bathroomsCount < 1 ||
      pricePerNight < 0 ||
      cleaningFee < 0
    ) {
      setError("Please enter valid property capacity, rooms and pricing.");
      return;
    }

    const englishAmenities = form.amenitiesEnText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const arabicAmenities = form.amenitiesArText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const amenityCount = Math.max(
      englishAmenities.length,
      arabicAmenities.length,
    );

    const amenities = Array.from({ length: amenityCount }, (_, index) => ({
      en: englishAmenities[index] || "",
      ar: arabicAmenities[index] || "",
    })).filter((item) => item.en && item.ar);

    const payload = {
      title: {
        en: form.titleEn.trim(),
        ar: form.titleAr.trim(),
      },
      propertyType: form.propertyType,
      roomsCount,
      maxGuests,
      bedsCount,
      bathroomsCount,
      amenities,
      description: {
        en: form.descriptionEn.trim(),
        ar: form.descriptionAr.trim(),
      },
      pricePerNight,
      cleaningFee,
      googleMapUrl: form.googleMapUrl.trim(),
      locationName: form.locationName.trim() || null,
      images: form.imagesText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      isAvailable: form.isAvailable,
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await rentalService.updateApartment(editingId, payload);
        setSuccess("Apartment listing updated successfully.");
      } else {
        await rentalService.addApartment(payload);
        setSuccess("New apartment listing created successfully.");
      }

      resetForm();
      await loadApartments();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save apartment details.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (apartment: ApartmentItem) => {
    const confirmed = window.confirm(
      `Remove "${apartment.title.en}" from public rental listing?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(apartment._id);
    setError(null);
    setSuccess(null);

    try {
      await rentalService.deleteApartment(apartment._id);
      setSuccess("Apartment removed from public rental listing.");

      if (editingId === apartment._id) {
        resetForm();
      }

      await loadApartments();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove apartment listing.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#F45A2A]">
            <Home className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
              Rental Administration
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-[#173C82]">Property </span>
            <span className="text-[#F45A2A]">Management</span>
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage short-term rental listings and availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadApartments()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#173C82]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#173C82] transition hover:border-[#173C82]/35 hover:bg-[#F4F7FC] disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh listings
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

      <div className="grid gap-6 xl:grid-cols-[410px_minmax(0,1fr)]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F45A2A]">
                {editingId ? "Edit Listing" : "New Listing"}
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                {editingId ? "Update property" : "Add property"}
              </h3>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cancel apartment edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Property title — English
              </label>

              <input
                type="text"
                value={form.titleEn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    titleEn: event.target.value,
                  }))
                }
                placeholder="e.g. Downtown Executive Apartment"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Property title — Arabic
              </label>

              <input
                type="text"
                dir="rtl"
                value={form.titleAr}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    titleAr: event.target.value,
                  }))
                }
                placeholder="اسم العقار بالعربية"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Property type
              </label>

              <select
                value={form.propertyType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    propertyType: event.target.value as PropertyType,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              >
                {propertyTypes.map((propertyType) => (
                  <option key={propertyType} value={propertyType}>
                    {propertyType}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Rooms
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.roomsCount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      roomsCount: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Max guests
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.maxGuests}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maxGuests: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Beds
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.bedsCount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bedsCount: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Bathrooms
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.bathroomsCount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bathroomsCount: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Nightly rate
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pricePerNight}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pricePerNight: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Cleaning fee
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cleaningFee}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cleaningFee: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Location name
              </label>

              <input
                type="text"
                value={form.locationName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    locationName: event.target.value,
                  }))
                }
                placeholder="e.g. Al Olaya, Riyadh"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Google Maps URL
              </label>

              <input
                type="url"
                value={form.googleMapUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    googleMapUrl: event.target.value,
                  }))
                }
                placeholder="https://maps.google.com/..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
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
                placeholder="Short property description"
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
                placeholder="وصف مختصر للعقار"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Image URLs (one per line)
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
                placeholder="https://example.com/property-image.jpg"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Amenities — English (one per line)
              </label>

              <textarea
                rows={3}
                value={form.amenitiesEnText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amenitiesEnText: event.target.value,
                  }))
                }
                placeholder="High-speed Wi-Fi&#10;Smart TV&#10;Fully equipped kitchen"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Amenities — Arabic (one per line)
              </label>

              <textarea
                rows={3}
                dir="rtl"
                value={form.amenitiesArText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amenitiesArText: event.target.value,
                  }))
                }
                placeholder="واي فاي عالي السرعة&#10;تلفزيون ذكي&#10;مطبخ مجهز بالكامل"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-700">
              Available for new booking requests
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

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#173C82] py-3 text-sm font-bold text-white shadow-[0_6px_14px_rgba(23,60,130,0.18)] transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#F45A2A]" />
                ) : editingId ? (
                  <PencilLine className="h-4 w-4 text-[#F45A2A]" />
                ) : (
                  <Plus className="h-4 w-4 text-[#F45A2A]" />
                )}

                {editingId ? "Save changes" : "Create listing"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
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
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F45A2A]">
                Property Directory
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                Active listings
              </h3>
            </div>

            <span className="rounded-full bg-[#F4F7FC] px-3 py-1 text-xs font-bold text-[#173C82]">
              {apartments.length} listings
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : apartments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                No active rental listings found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {apartments.map((apartment) => (
                <article
                  key={apartment._id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-bold text-slate-800">
                        {apartment.title.en}
                      </h4>

                      <span className="rounded-md bg-[#F4F7FC] px-2 py-1 text-[10px] font-bold text-[#173C82]">
                        {apartment.propertyType}
                      </span>
                    </div>

                    <p
                      dir="rtl"
                      className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                    >
                      {apartment.title.ar}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                      <span>{apartment.roomsCount} rooms</span>
                      <span>Up to {apartment.maxGuests} guests</span>
                      <span>
                        SAR {apartment.pricePerNight.toFixed(2)} / night
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(apartment)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC]"
                      title="Edit apartment"
                      aria-label={`Edit ${apartment.title.en}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteClick(apartment)}
                      disabled={deletingId === apartment._id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Remove listing"
                      aria-label={`Remove ${apartment.title.en}`}
                    >
                      {deletingId === apartment._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};