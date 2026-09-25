import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Dome,
  Edit3,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  hajjService,
  type HajjPackageItem,
  type PackageTier,
  type PackageType,
} from "../../services/hajj/hajjService";

const packageTypes: PackageType[] = ["Hajj", "Umrah"];
const packageTiers: PackageTier[] = ["Economy", "Executive", "VIP"];

const createInitialForm = () => ({
  titleEn: "",
  titleAr: "",
  packageType: "Umrah" as PackageType,
  tier: "Economy" as PackageTier,
  price: "",
  discountedPrice: "",
  durationDays: "7",
  departureCity: "",
  descriptionEn: "",
  descriptionAr: "",
  imagesText: "",
  featuresEnText: "",
  featuresArText: "",
});

export const HajjManagementPage: React.FC = () => {
  const [packages, setPackages] = useState<HajjPackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(createInitialForm);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await hajjService.getPackages();
      setPackages(response.data.packages);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load package directory.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPackages();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
  };

  const handleEditClick = (pkg: HajjPackageItem) => {
    setError(null);
    setSuccess(null);
    setEditingId(pkg._id);

    setForm({
      titleEn: pkg.title.en,
      titleAr: pkg.title.ar,
      packageType: pkg.packageType,
      tier: pkg.tier,
      price: String(pkg.price),
      discountedPrice:
        pkg.discountedPrice !== null ? String(pkg.discountedPrice) : "",
      durationDays: String(pkg.durationDays),
      departureCity: pkg.departureCity || "",
      descriptionEn: pkg.description?.en || "",
      descriptionAr: pkg.description?.ar || "",
      imagesText: pkg.images?.join("\n") || "",
      featuresEnText: pkg.features.map((feature) => feature.en).join("\n"),
      featuresArText: pkg.features.map((feature) => feature.ar).join("\n"),
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
    const durationDays = Number(form.durationDays);

    if (price < 0 || durationDays < 1) {
      setError("Please enter a valid package price and duration.");
      return;
    }

    if (discountedPrice !== null && discountedPrice > price) {
      setError("Discounted price cannot be greater than regular price.");
      return;
    }

    const englishFeatures = form.featuresEnText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const arabicFeatures = form.featuresArText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const featureCount = Math.max(
      englishFeatures.length,
      arabicFeatures.length,
    );

    const features = Array.from({ length: featureCount }, (_, index) => ({
      en: englishFeatures[index] || "",
      ar: arabicFeatures[index] || "",
    })).filter((feature) => feature.en && feature.ar);

    const payload = {
      title: {
        en: form.titleEn.trim(),
        ar: form.titleAr.trim(),
      },
      packageType: form.packageType,
      tier: form.tier,
      price,
      discountedPrice,
      durationDays,
      departureCity: form.departureCity.trim() || null,
      images: form.imagesText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      description: {
        en: form.descriptionEn.trim(),
        ar: form.descriptionAr.trim(),
      },
      features,
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await hajjService.updatePackage(editingId, payload);
        setSuccess("Package details updated successfully.");
      } else {
        await hajjService.addPackage(payload);
        setSuccess("New Hajj and Umrah package created successfully.");
      }

      resetForm();
      await loadPackages();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save package details.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = async (pkg: HajjPackageItem) => {
    const confirmed = window.confirm(
      `Remove "${pkg.title.en}" from public package listing?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(pkg._id);
    setError(null);
    setSuccess(null);

    try {
      await hajjService.deletePackage(pkg._id);
      setSuccess("Package removed from public listing.");

      if (editingId === pkg._id) {
        resetForm();
      }

      await loadPackages();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove this package.",
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
            <Dome className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
              <span className="text-[#173C82]">Hajj & Umrah </span>{" "}
              Administration
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-[#173C82]">Package </span>
            <span className="text-[#F45A2A]">Management</span>
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create and maintain Hajj and Umrah package information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPackages()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#173C82]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#173C82] transition hover:border-[#173C82]/35 hover:bg-[#F4F7FC] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh packages
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
                {editingId ? "Edit Package" : "New Package"}
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                {editingId ? "Update package details" : "Add package"}
              </h3>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cancel package edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Package title - English
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
                placeholder="e.g. Premium Umrah Journey"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Package title - Arabic
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
                placeholder="اسم الباقة بالعربية"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-right text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Package Type Dropdown */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Package type
                </label>

                <div className="relative">
                  <select
                    value={form.packageType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        packageType: event.target.value as PackageType,
                      }))
                    }
                    className="w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm font-medium text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  >
                    {packageTypes.map((packageType) => (
                      <option key={packageType} value={packageType}>
                        {packageType}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500">
                    <svg
                      className="h-3.5 w-3.5"
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

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Tier
                </label>

                <div className="relative">
                  <select
                    value={form.tier}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tier: event.target.value as PackageTier,
                      }))
                    }
                    className="w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm font-medium text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  >
                    {packageTiers.map((packageTier) => (
                      <option key={packageTier} value={packageTier}>
                        {packageTier}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500">
                    <svg
                      className="h-3.5 w-3.5"
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Price per pilgrim
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
                  Duration (days)
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.durationDays}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationDays: event.target.value,
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
                Departure city (optional)
              </label>

              <input
                type="text"
                value={form.departureCity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departureCity: event.target.value,
                  }))
                }
                placeholder="e.g. Riyadh, Jeddah"
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
                placeholder="Short package description"
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
                placeholder="وصف مختصر للباقة"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
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
                placeholder="https://example.com/package-image.jpg"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Features - English (one per line)
              </label>

              <textarea
                rows={3}
                value={form.featuresEnText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    featuresEnText: event.target.value,
                  }))
                }
                placeholder="Hotel accommodation&#10;Airport transfer&#10;Guided ziyarat"
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Features - Arabic (one per line)
              </label>

              <textarea
                rows={3}
                dir="rtl"
                value={form.featuresArText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    featuresArText: event.target.value,
                  }))
                }
                placeholder="إقامة فندقية&#10;نقل من المطار&#10;زيارات دينية"
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

                {editingId ? "Save changes" : "Create package"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
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
                Package Directory
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                Active packages
              </h3>
            </div>

            <span className="rounded-full bg-[#F4F7FC] px-3 py-1 text-xs font-bold text-[#173C82]">
              {packages.length} packages
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : packages.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                No active Hajj or Umrah packages have been created yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {packages.map((pkg) => {
                const hasDiscount =
                  pkg.discountedPrice !== null &&
                  pkg.discountedPrice < pkg.price;

                return (
                  <article
                    key={pkg._id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-bold text-slate-800">
                          {pkg.title.en}
                        </h4>

                        <span className="rounded-md bg-[#F4F7FC] px-2 py-1 text-[10px] font-bold text-[#173C82]">
                          {pkg.packageType}
                        </span>

                        <span className="rounded-md bg-[#FFF4F0] px-2 py-1 text-[10px] font-bold text-[#D9481D]">
                          {pkg.tier}
                        </span>
                      </div>

                      <p
                        dir="rtl"
                        className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                      >
                        {pkg.title.ar}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span>{pkg.durationDays} days</span>
                        <span>Regular: SAR {pkg.price.toFixed(2)}</span>

                        {hasDiscount && (
                          <span className="font-bold text-[#F45A2A]">
                            Offer: SAR {pkg.discountedPrice?.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(pkg)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC]"
                        title="Edit package"
                        aria-label={`Edit ${pkg.title.en}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeletePackage(pkg)}
                        disabled={deletingId === pkg._id}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Remove package"
                        aria-label={`Remove ${pkg.title.en}`}
                      >
                        {deletingId === pkg._id ? (
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
    </div>
  );
};
