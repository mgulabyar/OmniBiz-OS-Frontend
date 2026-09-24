import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  X,
} from "lucide-react";
import {
  dynamicService,
  type BusinessModuleItem,
  type DynamicFormField,
  type DynamicFormItem,
} from "../../services/dynamic/dynamicService";

const getInputType = (fieldType: DynamicFormField["fieldType"]) => {
  const inputTypes: Record<DynamicFormField["fieldType"], string> = {
    text: "text",
    number: "number",
    date: "date",
    select: "text",
    textarea: "text",
    email: "email",
    phone: "tel",
  };

  return inputTypes[fieldType];
};

const getFieldId = (formId: string, field: DynamicFormField) => {
  const safeFieldKey = field.fieldKey.replace(/[^a-zA-Z0-9_-]/g, "-");

  return `dynamic-form-${formId}-${safeFieldKey}`;
};

export const DynamicBusinessDirectoryPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessModuleItem[]>([]);
  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessModuleItem | null>(null);
  const [forms, setForms] = useState<DynamicFormItem[]>([]);
  const [selectedForm, setSelectedForm] = useState<DynamicFormItem | null>(
    null,
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingForms, setLoadingForms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [successData, setSuccessData] = useState<{
    message: string;
    reference: string;
    whatsappUrl: string | null;
  } | null>(null);

  const activeBusinessRequestRef = useRef(0);

  const sortedFields = useMemo(() => {
    if (!selectedForm) {
      return [];
    }

    return [...selectedForm.fields].sort(
      (first, second) => first.order - second.order,
    );
  }, [selectedForm]);

  const loadBusinesses = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await dynamicService.getActiveEcosystem();
      setBusinesses(response.data.ecosystems);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load new business services.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadBusinesses();
  }, []);

  const closeForm = () => {
    if (submitting) {
      return;
    }

    activeBusinessRequestRef.current += 1;
    setSelectedBusiness(null);
    setForms([]);
    setSelectedForm(null);
    setAnswers({});
    setError(null);
  };

  const handleSelectBusiness = async (business: BusinessModuleItem) => {
    const requestId = activeBusinessRequestRef.current + 1;

    activeBusinessRequestRef.current = requestId;
    setSelectedBusiness(business);
    setForms([]);
    setSelectedForm(null);
    setAnswers({});
    setError(null);
    setLoadingForms(true);

    try {
      const response = await dynamicService.getFormsByBusiness(business._id);

      if (activeBusinessRequestRef.current !== requestId) {
        return;
      }

      const availableForms = response.data.forms ?? [];

      setForms(availableForms);

      if (availableForms.length === 1) {
        setSelectedForm(availableForms[0]);
      }
    } catch (requestError) {
      if (activeBusinessRequestRef.current !== requestId) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load request form for this business.",
      );
    } finally {
      if (activeBusinessRequestRef.current === requestId) {
        setLoadingForms(false);
      }
    }
  };

  const updateAnswer = (fieldKey: string, value: string) => {
    setAnswers((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  };

  const handleFormChange = (formId: string) => {
    const nextForm = forms.find((form) => form._id === formId) || null;

    setSelectedForm(nextForm);
    setAnswers({});
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedBusiness || !selectedForm || submitting) {
      return;
    }

    const missingRequiredField = sortedFields.find(
      (field) => field.isRequired && !answers[field.fieldKey]?.trim(),
    );

    if (missingRequiredField) {
      setError(`${missingRequiredField.label.en} is required.`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await dynamicService.submitDynamicForm({
        businessModuleId: selectedBusiness._id,
        formId: selectedForm._id,
        answers,
      });

      setSuccessData({
        message:
          response.message || "Your request has been submitted successfully.",
        reference: response.data.submission._id,
        whatsappUrl: response.data.customerWhatsAppUrl || null,
      });

      activeBusinessRequestRef.current += 1;
      setSelectedBusiness(null);
      setForms([]);
      setSelectedForm(null);
      setAnswers({});
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit your request.",
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
            Loading new business services...
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
              <BriefcaseBusiness className="h-4 w-4 text-[#F45A2A]" />

              <span className="text-[11px] font-bold uppercase tracking-wide">
                OmniBiz <span className="text-[#F45A2A]">Expansion</span>
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
              Request <span className="text-[#F45A2A]">Submitted</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Your request has been sent to the relevant OmniBiz team for
              review.
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
            {successData.message}
          </p>

          <div className="mt-5 rounded-lg bg-[#F4F7FC] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Request Reference
            </p>

            <p className="mt-1 break-all text-sm font-bold text-[#173C82]">
              {successData.reference}
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
              Explore More Services
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
            <BriefcaseBusiness className="h-4 w-4 text-[#F45A2A]" />

            <span className="text-[11px] font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Expansion</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Discover More <span className="text-[#F45A2A]">Services</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Explore new OmniBiz business services and submit your request
            directly to the relevant team.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#173C82]">
            Available Divisions
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Browse new OmniBiz business services and submit a request.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadBusinesses(true)}
          disabled={refreshing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#173C82] text-white transition hover:text-[#F45A2A] disabled:opacity-60"
          title="Refresh available business services"
          aria-label="Refresh available business services"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {error && !selectedBusiness && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedBusiness ? (
        <section className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-start justify-between border-b border-slate-100 bg-[#F4F7FC] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#173C82]">
                <BriefcaseBusiness className="h-4 w-4 text-[#F45A2A]" />

                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {selectedBusiness.businessCategory}
                </span>
              </div>

              <h2 className="mt-2 truncate text-lg font-bold text-[#173C82]">
                {selectedBusiness.name.en}
              </h2>

              {selectedBusiness.name.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {selectedBusiness.name.ar}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={submitting}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition hover:bg-[#FFF4F0] hover:text-[#F45A2A] disabled:opacity-50"
              aria-label="Close service request form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {loadingForms ? (
              <div className="flex min-h-50 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
              </div>
            ) : forms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <ClipboardList className="mx-auto h-7 w-7 text-[#173C82]/50" />

                <h3 className="mt-3 text-sm font-bold text-[#173C82]">
                  Request Form Coming Soon
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  This business division is active, but its customer request
                  form has not been configured yet.
                </p>
              </div>
            ) : (
              <>
                {forms.length > 1 && (
                  <div className="mb-5">
                    <label
                      htmlFor="dynamic-form-selector"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Select Request Form
                    </label>

                    <select
                      id="dynamic-form-selector"
                      value={selectedForm?._id || ""}
                      onChange={(event) => handleFormChange(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                    >
                      <option value="">Select a form</option>

                      {forms.map((form) => (
                        <option key={form._id} value={form._id}>
                          {form.formTitle.en}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedForm ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-[#173C82]">
                        {selectedForm.formTitle.en}
                      </h3>

                      {selectedForm.formDescription?.en && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {selectedForm.formDescription.en}
                        </p>
                      )}
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {sortedFields.map((field) => {
                      const fieldId = getFieldId(selectedForm._id, field);
                      const fieldValue = answers[field.fieldKey] || "";

                      return (
                        <div key={field._id || field.fieldKey}>
                          <label
                            htmlFor={fieldId}
                            className="mb-1.5 block text-xs font-bold text-slate-700"
                          >
                            {field.label.en}

                            {field.isRequired && (
                              <span
                                className="ml-1 text-[#F45A2A]"
                                aria-label="required"
                              >
                                *
                              </span>
                            )}
                          </label>

                          {field.fieldType === "textarea" ? (
                            <textarea
                              id={fieldId}
                              rows={4}
                              value={fieldValue}
                              onChange={(event) =>
                                updateAnswer(field.fieldKey, event.target.value)
                              }
                              placeholder={field.placeholder?.en || ""}
                              required={field.isRequired}
                              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                            />
                          ) : field.fieldType === "select" ? (
                            <select
                              id={fieldId}
                              value={fieldValue}
                              onChange={(event) =>
                                updateAnswer(field.fieldKey, event.target.value)
                              }
                              required={field.isRequired}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                            >
                              <option value="">Select an option</option>

                              {(field.options ?? []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={fieldId}
                              type={getInputType(field.fieldType)}
                              value={fieldValue}
                              onChange={(event) =>
                                updateAnswer(field.fieldKey, event.target.value)
                              }
                              placeholder={field.placeholder?.en || ""}
                              required={field.isRequired}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#173C82] focus:ring-4 focus:ring-[#173C82]/10"
                            />
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] px-4 text-sm font-bold text-white transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#F45A2A]" />
                      )}

                      {submitting ? "Submitting Request..." : "Submit Request"}
                    </button>
                  </form>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                    <ClipboardList className="mx-auto h-6 w-6 text-[#173C82]/45" />

                    <p className="mt-3 text-sm font-semibold text-[#173C82]">
                      Select a request form to continue
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      ) : businesses.length === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <BriefcaseBusiness className="h-6 w-6 text-[#173C82]" />
          </div>

          <h2 className="mt-4 text-lg font-bold">
            <span className="text-[#173C82]">No New Services </span>
            <span className="text-[#F45A2A]">Yet</span>
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            New OmniBiz business services will appear here as they become
            available.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business) => (
            <article
              key={business._id}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#173C82]/20 hover:shadow-[0_10px_24px_rgba(23,60,130,0.08)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F4F7FC] text-[#173C82]">
                <BriefcaseBusiness className="h-5 w-5 text-[#F45A2A]" />
              </div>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#F45A2A]">
                {business.businessCategory}
              </p>

              <h2 className="mt-1 truncate text-base font-bold text-[#173C82]">
                {business.name.en}
              </h2>

              {business.name.ar && (
                <p
                  dir="rtl"
                  className="mt-1 text-right text-xs font-semibold text-[#173C82]/70"
                >
                  {business.name.ar}
                </p>
              )}

              {business.description?.en ? (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                  {business.description.en}
                </p>
              ) : (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                  Submit a request and connect directly with the relevant
                  OmniBiz service team.
                </p>
              )}

              {business.branches?.length > 0 && (
                <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-[#F45A2A]" />
                  {business.branches.length} branch
                  {business.branches.length !== 1 ? "es" : ""}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleSelectBusiness(business)}
                className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#173C82] px-3 text-xs font-bold text-white transition hover:bg-[#102D63]"
              >
                Send Request
                <ChevronRight className="h-4 w-4 text-[#F45A2A]" />
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};
