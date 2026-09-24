import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
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
  type DynamicFieldType,
  type DynamicFormField,
  type DynamicFormItem,
} from "../../services/dynamic/dynamicService";

const fieldTypes: DynamicFieldType[] = [
  "text",
  "number",
  "date",
  "select",
  "textarea",
  "email",
  "phone",
];

const fieldTypeLabels: Record<DynamicFieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Select List",
  textarea: "Long Text",
  email: "Email Address",
  phone: "Phone Number",
};

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

const createEmptyField = (order: number): DynamicFormField => ({
  fieldKey: `field_${order + 1}`,
  label: {
    en: "",
    ar: "",
  },
  fieldType: "text",
  placeholder: {
    en: "",
    ar: "",
  },
  isRequired: false,
  options: [],
  order,
});

const normalizeFieldKey = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const getBusinessId = (businessModule: DynamicFormItem["businessModule"]) =>
  typeof businessModule === "string"
    ? businessModule
    : businessModule?._id || "";

const getBusinessName = (
  businessModule: DynamicFormItem["businessModule"],
) => {
  if (typeof businessModule === "string") {
    return "Business Division";
  }

  return businessModule?.name?.en || "Business Division";
};

export const DynamicFormBuilderPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessModuleItem[]>([]);
  const [forms, setForms] = useState<DynamicFormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DynamicFormItem | null>(
    null,
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  const [businessModuleId, setBusinessModuleId] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [fields, setFields] = useState<DynamicFormField[]>([
    createEmptyField(0),
  ]);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const formCountLabel = useMemo(() => {
    return `${forms.length} form${forms.length !== 1 ? "s" : ""}`;
  }, [forms.length]);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [businessResponse, formResponse] = await Promise.all([
        dynamicService.getAdminBusinesses(),
        dynamicService.getAdminForms(),
      ]);

      setBusinesses(businessResponse.data.businesses ?? []);
      setForms(formResponse.data.forms ?? []);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load dynamic form configuration data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = () => {
    if (submitting) {
      return;
    }

    setEditingId(null);
    setBusinessModuleId("");
    setTitleEn("");
    setTitleAr("");
    setDescriptionEn("");
    setDescriptionAr("");
    setFields([createEmptyField(0)]);
  };

  const addField = () => {
    setFields((current) => [...current, createEmptyField(current.length)]);
  };

  const removeField = (index: number) => {
    if (fields.length === 1) {
      showToast("error", "A dynamic form must contain at least one field.");
      return;
    }

    setFields((current) =>
      current
        .filter((_, fieldIndex) => fieldIndex !== index)
        .map((field, fieldIndex) => ({
          ...field,
          order: fieldIndex,
        })),
    );
  };

  const updateField = (
    index: number,
    key: keyof DynamicFormField,
    value:
      | string
      | boolean
      | string[]
      | DynamicFieldType
      | DynamicFormField["label"]
      | DynamicFormField["placeholder"],
  ) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, [key]: value } : field,
      ),
    );
  };

  const updateFieldLabel = (
    index: number,
    language: "en" | "ar",
    value: string,
  ) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index
          ? {
              ...field,
              label: {
                ...field.label,
                [language]: value,
              },
            }
          : field,
      ),
    );
  };

  const updateFieldPlaceholder = (
    index: number,
    language: "en" | "ar",
    value: string,
  ) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index
          ? {
              ...field,
              placeholder: {
                en: field.placeholder?.en || "",
                ar: field.placeholder?.ar || "",
                [language]: value,
              },
            }
          : field,
      ),
    );
  };

  const handleEdit = (form: DynamicFormItem) => {
    setEditingId(form._id);
    setBusinessModuleId(getBusinessId(form.businessModule));
    setTitleEn(form.formTitle.en || "");
    setTitleAr(form.formTitle.ar || "");
    setDescriptionEn(form.formDescription?.en || "");
    setDescriptionAr(form.formDescription?.ar || "");

    const normalizedExistingFields = [...(form.fields ?? [])]
      .sort((first, second) => first.order - second.order)
      .map((field, index) => ({
        ...field,
        fieldKey: field.fieldKey || `field_${index + 1}`,
        label: {
          en: field.label?.en || "",
          ar: field.label?.ar || "",
        },
        placeholder: {
          en: field.placeholder?.en || "",
          ar: field.placeholder?.ar || "",
        },
        options: field.options ?? [],
        order: index,
      }));

    setFields(
      normalizedExistingFields.length > 0
        ? normalizedExistingFields
        : [createEmptyField(0)],
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!businessModuleId || !titleEn.trim() || !titleAr.trim()) {
      showToast(
        "error",
        "Business division and bilingual form titles are required.",
      );
      return;
    }

    const normalizedFields = fields.map((field, index) => ({
      ...field,
      fieldKey: normalizeFieldKey(field.fieldKey),
      label: {
        en: field.label.en.trim(),
        ar: field.label.ar.trim(),
      },
      placeholder: {
        en: field.placeholder?.en?.trim() || "",
        ar: field.placeholder?.ar?.trim() || "",
      },
      options: (field.options ?? [])
        .map((option) => option.trim())
        .filter(Boolean),
      order: index,
    }));

    if (
      normalizedFields.some(
        (field) => !field.fieldKey || !field.label.en || !field.label.ar,
      )
    ) {
      showToast(
        "error",
        "Every field needs a unique key plus English and Arabic labels.",
      );
      return;
    }

    const fieldKeys = normalizedFields.map((field) => field.fieldKey);

    if (new Set(fieldKeys).size !== fieldKeys.length) {
      showToast("error", "Every form field key must be unique.");
      return;
    }

    const missingSelectOptions = normalizedFields.some(
      (field) => field.fieldType === "select" && field.options.length === 0,
    );

    if (missingSelectOptions) {
      showToast(
        "error",
        "Every select field must include at least one option.",
      );
      return;
    }

    const payload = {
      businessModule: businessModuleId,
      formTitle: {
        en: titleEn.trim(),
        ar: titleAr.trim(),
      },
      formDescription: {
        en: descriptionEn.trim(),
        ar: descriptionAr.trim(),
      },
      fields: normalizedFields,
      successMessage: {
        en: "Your request has been submitted successfully.",
        ar: "تم إرسال طلبك بنجاح.",
      },
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await dynamicService.updateForm(editingId, payload);
        showToast("success", "Dynamic form updated successfully.");
      } else {
        await dynamicService.createForm(payload);
        showToast("success", "New dynamic form created successfully.");
      }

      setEditingId(null);
      setBusinessModuleId("");
      setTitleEn("");
      setTitleAr("");
      setDescriptionEn("");
      setDescriptionAr("");
      setFields([createEmptyField(0)]);

      await loadData(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to save dynamic form.",
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
      await dynamicService.deleteForm(deleteTarget._id);

      if (editingId === deleteTarget._id) {
        setEditingId(null);
        setBusinessModuleId("");
        setTitleEn("");
        setTitleAr("");
        setDescriptionEn("");
        setDescriptionAr("");
        setFields([createEmptyField(0)]);
      }

      showToast("success", "Dynamic form deactivated successfully.");
      setDeleteTarget(null);
      await loadData(true);
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to deactivate dynamic form.",
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
            <ClipboardList className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Expansion Hub</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Dynamic Form <span className="text-[#F45A2A]">Builder</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Configure bilingual customer request forms for every current and
            future business division.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Form Directory
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formCountLabel} configured across available business divisions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh dynamic forms"
          aria-label="Refresh dynamic forms"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-[#173C82]">
                <ClipboardList className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {editingId ? "Update Form" : "New Form"}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                {editingId ? (
                  <>
                    Edit <span className="text-[#F45A2A]">Dynamic Form</span>
                  </>
                ) : (
                  <>
                    Configure <span className="text-[#F45A2A]">Form</span>
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
                aria-label="Cancel form edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Business Division
              </label>

              <select
                value={businessModuleId}
                onChange={(event) => setBusinessModuleId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                required
              >
                <option value="">Select a business division</option>

                {businesses
                  .filter((business) => business.isActive)
                  .map((business) => (
                    <option key={business._id} value={business._id}>
                      {business.name.en}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Form Title — English
                </label>

                <input
                  type="text"
                  value={titleEn}
                  onChange={(event) => setTitleEn(event.target.value)}
                  placeholder="e.g. Property Inquiry"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Form Title — Arabic
                </label>

                <input
                  type="text"
                  dir="rtl"
                  value={titleAr}
                  onChange={(event) => setTitleAr(event.target.value)}
                  placeholder="عنوان النموذج بالعربية"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Description — English{" "}
                  <span className="font-medium text-slate-400">(optional)</span>
                </label>

                <textarea
                  rows={3}
                  value={descriptionEn}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                  placeholder="Form description in English"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Description — Arabic{" "}
                  <span className="font-medium text-slate-400">(optional)</span>
                </label>

                <textarea
                  rows={3}
                  dir="rtl"
                  value={descriptionAr}
                  onChange={(event) => setDescriptionAr(event.target.value)}
                  placeholder="وصف النموذج بالعربية"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#173C82]">
                    Form Fields
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Configure the customer information required for this request.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addField}
                  disabled={submitting}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F4F7FC] px-3 py-2 text-xs font-bold text-[#173C82] transition hover:bg-[#DCE7FA] disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5 text-[#F45A2A]" />
                  Add Field
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={`${field.fieldKey}-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#173C82]">
                        Field {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        disabled={submitting || fields.length === 1}
                        className="text-xs font-bold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Field Key
                        </label>

                        <input
                          type="text"
                          value={field.fieldKey}
                          onChange={(event) =>
                            updateField(
                              index,
                              "fieldKey",
                              normalizeFieldKey(event.target.value),
                            )
                          }
                          placeholder="field_key"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Field Type
                        </label>

                        <select
                          value={field.fieldType}
                          onChange={(event) =>
                            updateField(
                              index,
                              "fieldType",
                              event.target.value as DynamicFieldType,
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                        >
                          {fieldTypes.map((fieldType) => (
                            <option key={fieldType} value={fieldType}>
                              {fieldTypeLabels[fieldType]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Label — English
                        </label>

                        <input
                          type="text"
                          value={field.label.en}
                          onChange={(event) =>
                            updateFieldLabel(index, "en", event.target.value)
                          }
                          placeholder="Label in English"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Label — Arabic
                        </label>

                        <input
                          type="text"
                          dir="rtl"
                          value={field.label.ar}
                          onChange={(event) =>
                            updateFieldLabel(index, "ar", event.target.value)
                          }
                          placeholder="التسمية بالعربية"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Placeholder — English
                        </label>

                        <input
                          type="text"
                          value={field.placeholder?.en || ""}
                          onChange={(event) =>
                            updateFieldPlaceholder(
                              index,
                              "en",
                              event.target.value,
                            )
                          }
                          placeholder="Optional placeholder"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Placeholder — Arabic
                        </label>

                        <input
                          type="text"
                          dir="rtl"
                          value={field.placeholder?.ar || ""}
                          onChange={(event) =>
                            updateFieldPlaceholder(
                              index,
                              "ar",
                              event.target.value,
                            )
                          }
                          placeholder="نص توضيحي اختياري"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                        />
                      </div>
                    </div>

                    {field.fieldType === "select" && (
                      <div className="mt-3">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Options
                        </label>

                        <input
                          type="text"
                          value={(field.options ?? []).join(", ")}
                          onChange={(event) =>
                            updateField(
                              index,
                              "options",
                              event.target.value
                                .split(",")
                                .map((option) => option.trim())
                                .filter(Boolean),
                            )
                          }
                          placeholder="Options, separated by commas"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                        />
                      </div>
                    )}

                    <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
                      Required Field

                      <input
                        type="checkbox"
                        checked={field.isRequired}
                        onChange={(event) =>
                          updateField(
                            index,
                            "isRequired",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 accent-[#173C82]"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="h-11 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel Edit
                </button>
              )}

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

                {editingId ? "Save Form Changes" : "Create Dynamic Form"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-[#173C82]">
                <ClipboardList className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Form Directory
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#173C82]">
                Configured <span className="text-[#F45A2A]">Forms</span>
              </h2>
            </div>

            <span className="rounded-md bg-[#F4F7FC] px-2.5 py-1.5 text-xs font-bold text-[#173C82]">
              {formCountLabel}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : forms.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ClipboardList className="mx-auto h-7 w-7 text-[#173C82]/25" />

              <p className="mt-3 text-sm font-medium text-slate-500">
                No dynamic forms have been configured yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {forms.map((form) => (
                <article
                  key={form._id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-[#173C82]">
                        {form.formTitle.en}
                      </h3>

                      <span className="rounded-md bg-[#F4F7FC] px-2 py-1 text-[10px] font-bold text-[#173C82]">
                        {(form.fields ?? []).length} fields
                      </span>

                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                          form.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {form.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {form.formTitle.ar && (
                      <p
                        dir="rtl"
                        className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                      >
                        {form.formTitle.ar}
                      </p>
                    )}

                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Business: {getBusinessName(form.businessModule)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(form)}
                      disabled={submitting || Boolean(deletingId)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-60"
                      title="Edit form"
                      aria-label={`Edit ${form.formTitle.en}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(form)}
                      disabled={submitting || Boolean(deletingId)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Deactivate form"
                      aria-label={`Deactivate ${form.formTitle.en}`}
                    >
                      {deletingId === form._id ? (
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
            aria-labelledby="deactivate-form-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#173C82]">
                  <ClipboardList className="h-4 w-4 text-[#F45A2A]" />

                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    OmniBiz <span className="text-[#F45A2A]">Expansion Hub</span>
                  </span>
                </div>

                <h2
                  id="deactivate-form-title"
                  className="mt-3 text-xl font-bold tracking-tight text-[#173C82]"
                >
                  Deactivate <span className="text-[#F45A2A]">Form</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
                aria-label="Close form deactivation dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Selected Form
              </p>

              <p className="mt-1 text-sm font-bold text-[#173C82]">
                {deleteTarget.formTitle.en}
              </p>

              {deleteTarget.formTitle.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {deleteTarget.formTitle.ar}
                </p>
              )}

              <p className="mt-2 text-xs font-medium text-slate-500">
                {getBusinessName(deleteTarget.businessModule)} ·{" "}
                {(deleteTarget.fields ?? []).length} fields
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-700">
                This form will no longer be available to customers.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                Existing requests submitted through this form should remain
                available for administration and reporting, depending on your
                backend’s form-deactivation behavior.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Form Active
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

                {deletingId ? "Deactivating..." : "Deactivate Form"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};