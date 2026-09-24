import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Edit3,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  dynamicService,
  type BusinessModuleItem,
  type DynamicPaymentMethod,
  type WorkflowType,
} from "../../services/dynamic/dynamicService";

const workflowTypes: WorkflowType[] = [
  "SlotBooking",
  "DateRangeBooking",
  "InquiryOnly",
  "RFQEngine",
];

const paymentMethods: DynamicPaymentMethod[] = [
  "Mada",
  "Visa/Mastercard",
  "Apple Pay",
  "Cash",
  "Bank Transfer",
];

const workflowLabels: Record<WorkflowType, string> = {
  SlotBooking: "Slot Booking",
  DateRangeBooking: "Date Range Booking",
  InquiryOnly: "Inquiry Only",
  RFQEngine: "RFQ Engine",
};

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

const createInitialForm = () => ({
  nameEn: "",
  nameAr: "",
  slug: "",
  businessCategory: "",
  descriptionEn: "",
  descriptionAr: "",
  workflowType: "InquiryOnly" as WorkflowType,
  paymentMethodsAllowed: [] as DynamicPaymentMethod[],
  contactWhatsAppNumber: "",
  icon: "BriefcaseBusiness",
});

const createSlugFromName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export const DynamicBusinessManagementPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessModuleItem | null>(
    null,
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const [form, setForm] = useState(createInitialForm);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadBusinesses = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await dynamicService.getAdminBusinesses();
      setBusinesses(response.data.businesses ?? []);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load business divisions.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadBusinesses();
  }, []);

  const divisionCountLabel = useMemo(() => {
    return `${businesses.length} division${businesses.length !== 1 ? "s" : ""}`;
  }, [businesses.length]);

  const resetForm = () => {
    if (submitting) {
      return;
    }

    setEditingId(null);
    setForm(createInitialForm());
  };

  const handleEdit = (business: BusinessModuleItem) => {
    setEditingId(business._id);

    setForm({
      nameEn: business.name?.en || "",
      nameAr: business.name?.ar || "",
      slug: business.slug || "",
      businessCategory: business.businessCategory || "",
      descriptionEn: business.description?.en || "",
      descriptionAr: business.description?.ar || "",
      workflowType: business.workflowType,
      paymentMethodsAllowed: business.paymentMethodsAllowed ?? [],
      contactWhatsAppNumber: business.contactWhatsAppNumber || "",
      icon: business.icon || "BriefcaseBusiness",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePaymentMethod = (paymentMethod: DynamicPaymentMethod) => {
    setForm((current) => ({
      ...current,
      paymentMethodsAllowed: current.paymentMethodsAllowed.includes(
        paymentMethod,
      )
        ? current.paymentMethodsAllowed.filter(
            (method) => method !== paymentMethod,
          )
        : [...current.paymentMethodsAllowed, paymentMethod],
    }));
  };

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      nameEn: value,
      slug: current.slug || createSlugFromName(value),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedSlug = createSlugFromName(form.slug);

    if (!form.nameEn.trim() || !form.nameAr.trim()) {
      showToast("error", "Please provide both English and Arabic business names.");
      return;
    }

    if (!normalizedSlug || !form.businessCategory.trim()) {
      showToast("error", "Business slug and category are required.");
      return;
    }

    const payload = {
      name: {
        en: form.nameEn.trim(),
        ar: form.nameAr.trim(),
      },
      slug: normalizedSlug,
      businessCategory: form.businessCategory.trim(),
      description: {
        en: form.descriptionEn.trim(),
        ar: form.descriptionAr.trim(),
      },
      workflowType: form.workflowType,
      paymentMethodsAllowed: form.paymentMethodsAllowed,
      contactWhatsAppNumber: form.contactWhatsAppNumber.trim() || null,
      icon: form.icon.trim() || "BriefcaseBusiness",
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await dynamicService.updateBusiness(editingId, payload);
        showToast("success", "Business division updated successfully.");
      } else {
        await dynamicService.createBusiness(payload);
        showToast("success", "New business division created successfully.");
      }

      setEditingId(null);
      setForm(createInitialForm());
      await loadBusinesses(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to save business division.",
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

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletingId(deleteTarget._id);

    try {
      await dynamicService.deleteBusiness(deleteTarget._id);

      if (editingId === deleteTarget._id) {
        setEditingId(null);
        setForm(createInitialForm());
      }

      showToast("success", "Business division removed from the active ecosystem.");
      setDeleteTarget(null);
      await loadBusinesses(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove business division.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {toast && (
        <div
          className={`fixed right-4 top-24 z-[100] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border p-4 shadow-xl sm:right-6 ${
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
            <BriefcaseBusiness className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Expansion Hub</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Business <span className="text-[#F45A2A]">Divisions</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Create future business divisions, select workflow capabilities and
            configure their payment options without rebuilding the platform.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Business Ecosystem
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {divisionCountLabel} configured in the expansion hub.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadBusinesses(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh business divisions"
          aria-label="Refresh business divisions"
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
                <BriefcaseBusiness className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {editingId ? "Update Division" : "New Division"}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                {editingId ? (
                  <>
                    Edit <span className="text-[#F45A2A]">Division</span>
                  </>
                ) : (
                  <>
                    Create <span className="text-[#F45A2A]">Division</span>
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
                aria-label="Cancel business edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Business Name — English
              </label>

              <input
                type="text"
                value={form.nameEn}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="e.g. Real Estate Services"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Business Name — Arabic
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
                placeholder="اسم النشاط بالعربية"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                URL Slug
              </label>

              <input
                type="text"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: createSlugFromName(event.target.value),
                  }))
                }
                placeholder="real-estate-services"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Business Category
              </label>

              <input
                type="text"
                value={form.businessCategory}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    businessCategory: event.target.value,
                  }))
                }
                placeholder="e.g. Property & Real Estate"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Workflow Type
              </label>

              <select
                value={form.workflowType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    workflowType: event.target.value as WorkflowType,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              >
                {workflowTypes.map((workflowType) => (
                  <option key={workflowType} value={workflowType}>
                    {workflowLabels[workflowType]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                WhatsApp Number{" "}
                <span className="font-medium text-slate-400">(optional)</span>
              </label>

              <input
                type="tel"
                value={form.contactWhatsAppNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contactWhatsAppNumber: event.target.value,
                  }))
                }
                placeholder="9665XXXXXXXX"
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
                placeholder="Short business description"
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
                placeholder="وصف مختصر للنشاط"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-slate-700">
                Allowed Payment Methods
              </p>

              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((paymentMethod) => {
                  const isSelected =
                    form.paymentMethodsAllowed.includes(paymentMethod);

                  return (
                    <button
                      key={paymentMethod}
                      type="button"
                      onClick={() => togglePaymentMethod(paymentMethod)}
                      aria-pressed={isSelected}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                        isSelected
                          ? "border-[#F45A2A] bg-[#FFF4F0] text-[#D9481D]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5]"
                      }`}
                    >
                      {paymentMethod}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-4 text-sm font-bold text-white transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <PencilLine className="h-4 w-4 text-[#F45A2A]" />
              ) : (
                <Plus className="h-4 w-4 text-[#F45A2A]" />
              )}

              {editingId ? "Save Changes" : "Create Division"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-[#173C82]">
                <BriefcaseBusiness className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Business Ecosystem
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                Future <span className="text-[#F45A2A]">Divisions</span>
              </h2>
            </div>

            <span className="rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-xs font-bold text-[#173C82]">
              {divisionCountLabel}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <BriefcaseBusiness className="mx-auto h-7 w-7 text-[#173C82]/25" />

              <p className="mt-3 text-sm font-medium text-slate-500">
                No future business divisions have been created yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {businesses.map((business) => {
                const workflowLabel =
                  workflowLabels[business.workflowType] ??
                  business.workflowType;

                return (
                  <article
                    key={business._id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-[#173C82]">
                          {business.name.en}
                        </h3>

                        <span className="rounded-md bg-[#F4F7FC] px-2 py-1 text-[10px] font-bold text-[#173C82]">
                          {workflowLabel}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                            business.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {business.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {business.name.ar && (
                        <p
                          dir="rtl"
                          className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                        >
                          {business.name.ar}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span>{business.businessCategory}</span>
                        <span>/{business.slug}</span>

                        {business.paymentMethodsAllowed?.length > 0 && (
                          <span>
                            {business.paymentMethodsAllowed.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(business)}
                        disabled={submitting || Boolean(deletingId)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-60"
                        title="Edit business division"
                        aria-label={`Edit ${business.name.en}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(business)}
                        disabled={submitting || Boolean(deletingId)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Deactivate business division"
                        aria-label={`Deactivate ${business.name.en}`}
                      >
                        {deletingId === business._id ? (
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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
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
            aria-labelledby="deactivate-business-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#173C82]">
                  <BriefcaseBusiness className="h-4 w-4 text-[#F45A2A]" />

                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    OmniBiz <span className="text-[#F45A2A]">Expansion Hub</span>
                  </span>
                </div>

                <h2
                  id="deactivate-business-title"
                  className="mt-3 text-xl font-bold tracking-tight text-[#173C82]"
                >
                  Remove <span className="text-[#F45A2A]">Division</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
                aria-label="Close business division removal dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Selected Division
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
                {deleteTarget.businessCategory} · /
                {deleteTarget.slug}
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-700">
                This will remove the division from the active ecosystem.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                Customers will no longer be able to submit new requests to this
                division. Existing submissions should remain available for
                administration and reporting.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Division
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                {deletingId ? "Removing..." : "Remove Division"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};