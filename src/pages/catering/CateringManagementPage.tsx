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
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  cateringService,
  type CateringCategory,
  type CateringMenuItem,
} from "../../services/catering/cateringService";

const categories: CateringCategory[] = [
  "Appetizer",
  "Main Course",
  "Dessert",
  "Beverage",
];

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

const createInitialForm = () => ({
  nameEn: "",
  nameAr: "",
  category: "Main Course" as CateringCategory,
  pricePerPerson: "",
  descriptionEn: "",
  descriptionAr: "",
  image: "",
  dietaryTagsText: "",
});

const getSafeNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const CateringManagementPage: React.FC = () => {
  const [menu, setMenu] = useState<CateringMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CateringMenuItem | null>(
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

  const loadMenu = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await cateringService.getMenu();
      setMenu(response.data.menuItems);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load catering menu.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadMenu();
  }, []);

  const menuCountLabel = useMemo(() => {
    return `${menu.length} item${menu.length !== 1 ? "s" : ""}`;
  }, [menu.length]);

  const resetForm = () => {
    if (submitting) {
      return;
    }

    setEditingId(null);
    setForm(createInitialForm());
  };

  const handleEditClick = (item: CateringMenuItem) => {
    setEditingId(item._id);

    setForm({
      nameEn: item.itemName.en || "",
      nameAr: item.itemName.ar || "",
      category: item.category,
      pricePerPerson: String(getSafeNumber(item.pricePerPerson, 0)),
      descriptionEn: item.description?.en || "",
      descriptionAr: item.description?.ar || "",
      image: item.image || "",
      dietaryTagsText: item.dietaryTags?.join(", ") || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const pricePerPerson = getSafeNumber(form.pricePerPerson, -1);

    if (!form.nameEn.trim() || !form.nameAr.trim()) {
      showToast("error", "Please enter the item name in English and Arabic.");
      return;
    }

    if (pricePerPerson < 0) {
      showToast("error", "Price per person cannot be negative.");
      return;
    }

    const payload = {
      itemName: {
        en: form.nameEn.trim(),
        ar: form.nameAr.trim(),
      },
      category: form.category,
      pricePerPerson,
      description: {
        en: form.descriptionEn.trim(),
        ar: form.descriptionAr.trim(),
      },
      image: form.image.trim() || null,
      dietaryTags: form.dietaryTagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await cateringService.updateMenuItem(editingId, payload);
        showToast("success", "Menu item updated successfully.");
      } else {
        await cateringService.addMenuItem(payload);
        showToast("success", "New menu item added successfully.");
      }

      setEditingId(null);
      setForm(createInitialForm());
      await loadMenu(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to save menu item.",
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

  const handleDeleteDish = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletingId(deleteTarget._id);

    try {
      await cateringService.deleteMenuItem(deleteTarget._id);

      if (editingId === deleteTarget._id) {
        setEditingId(null);
        setForm(createInitialForm());
      }

      showToast("success", "Menu item removed from the public catering menu.");
      setDeleteTarget(null);
      await loadMenu(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove this menu item.",
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
            <UtensilsCrossed className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Catering</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Menu <span className="text-[#F45A2A]">Management</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Create and maintain catering menu items, update guest pricing and
            provide dietary details for every dish.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Menu Directory
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {menuCountLabel} currently listed on the catering menu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMenu(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh catering menu"
          aria-label="Refresh catering menu"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-[#173C82]">
                <UtensilsCrossed className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {editingId ? "Update Item" : "New Item"}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                {editingId ? (
                  <>
                    Edit <span className="text-[#F45A2A]">Menu Item</span>
                  </>
                ) : (
                  <>
                    Add <span className="text-[#F45A2A]">Menu Item</span>
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
                aria-label="Cancel menu edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Item Name — English
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
                placeholder="e.g. Chicken Kabsa"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Item Name — Arabic
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
                placeholder="اسم الطبق بالعربية"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as CateringCategory,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Price / Guest
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pricePerPerson}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pricePerPerson: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>
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
                placeholder="Short menu item description"
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
                placeholder="وصف مختصر للطبق"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Image URL{" "}
                <span className="font-medium text-slate-400">(optional)</span>
              </label>

              <input
                type="url"
                value={form.image}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    image: event.target.value,
                  }))
                }
                placeholder="https://example.com/menu-item.jpg"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Dietary Tags{" "}
                <span className="font-medium text-slate-400">
                  (comma separated)
                </span>
              </label>

              <input
                type="text"
                value={form.dietaryTagsText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dietaryTagsText: event.target.value,
                  }))
                }
                placeholder="Vegetarian, Halal, Gluten-Free"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
              />
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

                {editingId ? "Save Changes" : "Create Menu Item"}
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
                <UtensilsCrossed className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Menu Directory
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                Active <span className="text-[#F45A2A]">Menu Items</span>
              </h2>
            </div>

            <span className="rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-xs font-bold text-[#173C82]">
              {menuCountLabel}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : menu.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <UtensilsCrossed className="mx-auto h-7 w-7 text-[#173C82]/25" />

              <p className="mt-3 text-sm font-medium text-slate-500">
                No catering menu items have been added yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {menu.map((item) => {
                const pricePerPerson = getSafeNumber(item.pricePerPerson, 0);

                return (
                  <article
                    key={item._id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-[#173C82]">
                          {item.itemName.en}
                        </h3>

                        <span className="rounded-md bg-[#F4F7FC] px-2 py-1 text-[10px] font-bold text-[#173C82]">
                          {item.category}
                        </span>
                      </div>

                      {item.itemName.ar && (
                        <p
                          dir="rtl"
                          className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                        >
                          {item.itemName.ar}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span>SAR {pricePerPerson.toFixed(2)} per guest</span>

                        {item.dietaryTags?.length > 0 && (
                          <span>{item.dietaryTags.join(", ")}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        disabled={submitting || Boolean(deletingId)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-60"
                        title="Edit menu item"
                        aria-label={`Edit ${item.itemName.en}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        disabled={submitting || Boolean(deletingId)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Remove menu item"
                        aria-label={`Remove ${item.itemName.en}`}
                      >
                        {deletingId === item._id ? (
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
            aria-labelledby="remove-menu-item-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#173C82]">
                  <UtensilsCrossed className="h-4 w-4 text-[#F45A2A]" />

                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    OmniBiz <span className="text-[#F45A2A]">Catering</span>
                  </span>
                </div>

                <h2
                  id="remove-menu-item-title"
                  className="mt-3 text-xl font-bold tracking-tight text-[#173C82]"
                >
                  Remove <span className="text-[#F45A2A]">Menu Item</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
                aria-label="Close menu item removal dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Selected Menu Item
              </p>

              <p className="mt-1 text-sm font-bold text-[#173C82]">
                {deleteTarget.itemName.en}
              </p>

              {deleteTarget.itemName.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {deleteTarget.itemName.ar}
                </p>
              )}

              <p className="mt-2 text-xs font-medium text-slate-500">
                {deleteTarget.category} · SAR{" "}
                {getSafeNumber(deleteTarget.pricePerPerson, 0).toFixed(2)} per
                guest
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-700">
                This item will be removed from the public catering menu.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                Customers will no longer be able to select this item in future
                catering orders. This action cannot be reversed.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Item
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteDish()}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                {deletingId ? "Removing..." : "Remove Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
