import React, { useEffect, useMemo, useState } from "react";
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

const propertyTypes: PropertyType[] = ["Apartment", "Studio", "Villa", "Room"];

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

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

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const ApartmentManagementPage: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApartmentItem | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [form, setForm] = useState(createInitialForm);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadApartments = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await rentalService.getApartments();
      setApartments(response.data.apartments ?? []);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load apartment directory.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadApartments();
  }, []);

  const listingCountLabel = useMemo(() => {
    return `${apartments.length} listing${apartments.length !== 1 ? "s" : ""}`;
  }, [apartments.length]);

  const resetForm = () => {
    if (submitting) {
      return;
    }

    setEditingId(null);
    setForm(createInitialForm());
  };

  const handleEditClick = (apartment: ApartmentItem) => {
    setEditingId(apartment._id);

    setForm({
      titleEn: apartment.title?.en || "",
      titleAr: apartment.title?.ar || "",
      propertyType: apartment.propertyType,
      roomsCount: String(getSafeNumber(apartment.roomsCount, 1)),
      maxGuests: String(getSafeNumber(apartment.maxGuests, 1)),
      bedsCount: String(getSafeNumber(apartment.bedsCount, 1)),
      bathroomsCount: String(getSafeNumber(apartment.bathroomsCount, 1)),
      pricePerNight: String(getSafeNumber(apartment.pricePerNight, 0)),
      cleaningFee: String(getSafeNumber(apartment.cleaningFee, 0)),
      googleMapUrl: apartment.googleMapUrl || "",
      locationName: apartment.locationName || "",
      descriptionEn: apartment.description?.en || "",
      descriptionAr: apartment.description?.ar || "",
      imagesText: apartment.images?.join("\n") || "",
      amenitiesEnText: (apartment.amenities ?? [])
        .map((item) => item.en)
        .filter(Boolean)
        .join("\n"),
      amenitiesArText: (apartment.amenities ?? [])
        .map((item) => item.ar)
        .filter(Boolean)
        .join("\n"),
      isAvailable: Boolean(apartment.isAvailable),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.titleEn.trim() || !form.titleAr.trim()) {
      showToast(
        "error",
        "Please enter the property title in English and Arabic.",
      );
      return;
    }

    const roomsCount = getSafeNumber(form.roomsCount, 0);
    const maxGuests = getSafeNumber(form.maxGuests, 0);
    const bedsCount = getSafeNumber(form.bedsCount, 0);
    const bathroomsCount = getSafeNumber(form.bathroomsCount, 0);
    const pricePerNight = getSafeNumber(form.pricePerNight, -1);
    const cleaningFee = getSafeNumber(form.cleaningFee, -1);
    const mapsUrl = form.googleMapUrl.trim();

    if (
      roomsCount < 1 ||
      maxGuests < 1 ||
      bedsCount < 1 ||
      bathroomsCount < 1 ||
      pricePerNight < 0 ||
      cleaningFee < 0
    ) {
      showToast(
        "error",
        "Please enter valid property capacity, rooms and pricing.",
      );
      return;
    }

    if (!mapsUrl || !isValidHttpUrl(mapsUrl)) {
      showToast("error", "Please enter a valid Google Maps URL.");
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

    const images = form.imagesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const invalidImageUrl = images.some(
      (imageUrl) => !isValidHttpUrl(imageUrl),
    );

    if (invalidImageUrl) {
      showToast(
        "error",
        "Each property image must use a valid http or https URL.",
      );
      return;
    }

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
      googleMapUrl: mapsUrl,
      locationName: form.locationName.trim() || null,
      images,
      isAvailable: form.isAvailable,
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await rentalService.updateApartment(editingId, payload);
        showToast("success", "Apartment listing updated successfully.");
      } else {
        await rentalService.addApartment(payload);
        showToast("success", "New apartment listing created successfully.");
      }

      setEditingId(null);
      setForm(createInitialForm());
      await loadApartments(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to save apartment details.",
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

  const handleDeleteApartment = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletingId(deleteTarget._id);

    try {
      await rentalService.deleteApartment(deleteTarget._id);

      if (editingId === deleteTarget._id) {
        setEditingId(null);
        setForm(createInitialForm());
      }

      showToast("success", "Apartment removed from the public rental listing.");
      setDeleteTarget(null);
      await loadApartments(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove apartment listing.",
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
            <Home className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Rentals</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Property <span className="text-[#F45A2A]">Management</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Create and maintain short-term rental listings, define guest
            capacity, update property details and manage public availability.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Property Directory
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {listingCountLabel} currently configured for rental guests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadApartments(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh rental listings"
          aria-label="Refresh rental listings"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[410px_minmax(0,1fr)]">
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-[#173C82]">
                <Home className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {editingId ? "Update Listing" : "New Listing"}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                {editingId ? (
                  <>
                    Edit <span className="text-[#F45A2A]">Property</span>
                  </>
                ) : (
                  <>
                    Add <span className="text-[#F45A2A]">Property</span>
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
                aria-label="Cancel apartment edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Property Title - English
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
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Property Title - Arabic
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
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-right text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Property Type
              </label>

              <div className="relative">
                <select
                  value={form.propertyType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      propertyType: event.target.value as PropertyType,
                    }))
                  }
                  className="w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm font-medium text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                >
                  {propertyTypes.map((propertyType) => (
                    <option key={propertyType} value={propertyType}>
                      {propertyType}
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
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Max Guests
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
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
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
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
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
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Nightly Rate
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
                  placeholder="0.00"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Cleaning Fee
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
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Location Name{" "}
                <span className="font-medium text-slate-400">(optional)</span>
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
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
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
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
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
                placeholder="Short property description"
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
                placeholder="وصف مختصر للعقار"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-right text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
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
                placeholder="https://example.com/property-image.jpg"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Amenities - English{" "}
                <span className="font-medium text-slate-400">
                  (one per line)
                </span>
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
                placeholder={
                  "High-speed Wi-Fi\nSmart TV\nFully equipped kitchen"
                }
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Amenities - Arabic{" "}
                <span className="font-medium text-slate-400">
                  (one per line)
                </span>
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
                placeholder={
                  "واي فاي عالي السرعة\nتلفزيون ذكي\nمطبخ مجهز بالكامل"
                }
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-right text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-xs font-bold text-slate-700">
              Available for New Booking Requests
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
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#173C82] px-4 text-sm font-semibold text-white transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <PencilLine className="h-4 w-4 text-[#F45A2A]" />
                ) : (
                  <Plus className="h-4 w-4 text-[#F45A2A]" />
                )}

                {editingId ? "Save Changes" : "Create Listing"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="h-10 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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
                <Home className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Property Directory
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                Active <span className="text-[#F45A2A]">Listings</span>
              </h2>
            </div>

            <span className="rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-xs font-bold text-[#173C82]">
              {listingCountLabel}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : apartments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Home className="mx-auto h-7 w-7 text-[#173C82]/25" />

              <p className="mt-3 text-sm font-medium text-slate-500">
                No rental listings have been created yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {apartments.map((apartment) => {
                const roomsCount = getSafeNumber(apartment.roomsCount, 0);
                const maxGuests = getSafeNumber(apartment.maxGuests, 0);
                const pricePerNight = getSafeNumber(apartment.pricePerNight, 0);

                return (
                  <article
                    key={apartment._id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-[#173C82]">
                          {apartment.title.en}
                        </h3>

                        <span className="rounded-md bg-[#F4F7FC] px-2 py-1 text-[10px] font-bold text-[#173C82]">
                          {apartment.propertyType}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                            apartment.isAvailable
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {apartment.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      {apartment.title.ar && (
                        <p
                          dir="rtl"
                          className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                        >
                          {apartment.title.ar}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span>{roomsCount} rooms</span>
                        <span>Up to {maxGuests} guests</span>
                        <span>SAR {pricePerNight.toFixed(2)} / night</span>

                        {apartment.locationName && (
                          <span>{apartment.locationName}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(apartment)}
                        disabled={submitting || Boolean(deletingId)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-60"
                        title="Edit apartment"
                        aria-label={`Edit ${apartment.title.en}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(apartment)}
                        disabled={submitting || Boolean(deletingId)}
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
            aria-labelledby="remove-apartment-title"
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
                  id="remove-apartment-title"
                  className="mt-3 text-xl font-bold tracking-tight text-[#173C82]"
                >
                  Remove <span className="text-[#F45A2A]">Listing</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
                aria-label="Close apartment listing removal dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Selected Listing
              </p>

              <p className="mt-1 text-sm font-bold text-[#173C82]">
                {deleteTarget.title.en}
              </p>

              {deleteTarget.title.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {deleteTarget.title.ar}
                </p>
              )}

              <p className="mt-2 text-xs font-medium text-slate-500">
                {deleteTarget.propertyType} ·{" "}
                {getSafeNumber(deleteTarget.roomsCount, 0)} rooms · Up to{" "}
                {getSafeNumber(deleteTarget.maxGuests, 0)} guests · SAR{" "}
                {getSafeNumber(deleteTarget.pricePerNight, 0).toFixed(2)} per
                night
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-700">
                This listing will be removed from the public rental directory.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                Guests will no longer be able to view or submit new booking
                requests for this property. Confirm only if you intend to remove
                it.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Listing
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteApartment()}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                {deletingId ? "Removing..." : "Remove Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
