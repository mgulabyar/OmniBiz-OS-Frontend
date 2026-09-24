import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Mail,
  PencilLine,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  salonService,
  type SalonServiceItem,
} from "../../services/salon/salonService";
import {
  staffService,
  type CreateStaffPayload,
  type StaffWithSpeciality,
} from "../../services/salon/staffService";

const allDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const createInitialForm = () => ({
  name: "",
  email: "",
  phone: "",
  speciality: [] as string[],
  workingDays: [] as string[],
  startTime: "10:00",
  endTime: "19:00",
  breakStart: "",
  breakEnd: "",
  photo: "",
});

export const StaffManagementPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffWithSpeciality[]>([]);
  const [services, setServices] = useState<SalonServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(createInitialForm);

  const isEditing = Boolean(editingId);

  const selectedServices = useMemo(
    () => services.filter((service) => form.speciality.includes(service._id)),
    [form.speciality, services],
  );

  const loadStaff = async () => {
    setLoading(true);

    try {
      const result = await staffService.getAllStaff();

      if (result.status === "success") {
        setStaffList(result.data.staff);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the salon staff directory.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    setLoadingServices(true);

    try {
      const result = await salonService.getServices();

      if (result.status === "success") {
        setServices(result.data.services);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load services for staff specialities.",
      );
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadStaff(), loadServices()]);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
  };

  const toggleWorkingDay = (day: string) => {
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
    }));
  };

  const toggleSpeciality = (serviceId: string) => {
    setForm((current) => ({
      ...current,
      speciality: current.speciality.includes(serviceId)
        ? current.speciality.filter((item) => item !== serviceId)
        : [...current.speciality, serviceId],
    }));
  };

  const handleEditClick = (staff: StaffWithSpeciality) => {
    setError(null);
    setSuccess(null);
    setEditingId(staff._id);

    setForm({
      name: staff.name,
      email: staff.email || "",
      phone: staff.phone || "",
      speciality: staff.speciality.map((service) => service._id),
      workingDays: staff.workingDays,
      startTime: staff.workingHours.startTime,
      endTime: staff.workingHours.endTime,
      breakStart: staff.workingHours.breakStart || "",
      breakEnd: staff.workingHours.breakEnd || "",
      photo: staff.photo || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.speciality.length === 0) {
      setError("Please assign at least one salon service to this beautician.");
      return;
    }

    if (form.workingDays.length === 0) {
      setError("Please select at least one working day.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setError("Working end time must be later than start time.");
      return;
    }

    const hasOnlyOneBreakValue =
      (form.breakStart && !form.breakEnd) ||
      (!form.breakStart && form.breakEnd);

    if (hasOnlyOneBreakValue) {
      setError("Please provide both break start and break end times.");
      return;
    }

    if (form.breakStart && form.breakEnd && form.breakStart >= form.breakEnd) {
      setError("Break end time must be later than break start time.");
      return;
    }

    const payload: CreateStaffPayload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      speciality: form.speciality,
      workingDays: form.workingDays,
      workingHours: {
        startTime: form.startTime,
        endTime: form.endTime,
        breakStart: form.breakStart || null,
        breakEnd: form.breakEnd || null,
      },
      photo: form.photo.trim() || null,
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await staffService.updateStaff(editingId, payload);
        setSuccess("Beautician profile updated successfully.");
      } else {
        await staffService.addStaff(payload);
        setSuccess("New beautician profile created successfully.");
      }

      resetForm();
      await loadStaff();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the staff profile.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (staff: StaffWithSpeciality) => {
    const confirmed = window.confirm(
      `Delete ${staff.name} from the salon staff directory?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(staff._id);
    setError(null);
    setSuccess(null);

    try {
      await staffService.deleteStaff(staff._id);
      setSuccess("Beautician profile deleted successfully.");

      if (editingId === staff._id) {
        resetForm();
      }

      await loadStaff();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this staff profile.",
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
            <Users className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
               <span className="text-[#173C82]">Salon</span> Administration
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Beautician <span className="text-[#F45A2A]">Management</span> 
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage staff services, weekly availability and working hours.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void Promise.all([loadStaff(), loadServices()])}
          disabled={loading || loadingServices}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#173C82]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#173C82] transition hover:border-[#173C82]/35 hover:bg-[#F4F7FC] disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading || loadingServices ? "animate-spin" : ""
            }`}
          />
          Refresh directory
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#F45A2A]">
                {isEditing ? "Edit Profile" : "New Profile"}
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                {isEditing ? "Update beautician" : "Add beautician"}
              </h3>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cancel staff edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Full name
              </label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Maria Ahmed"
                  className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Email (optional)
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="staff@email.com"
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Phone (optional)
                </label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+966 5X XXX XXXX"
                    className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-500 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Assigned services
                </label>

                {loadingServices && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#173C82]" />
                )}
              </div>

              {services.length === 0 && !loadingServices ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-medium text-slate-500">
                  Create salon services first, then assign them to a beautician.
                </div>
              ) : (
                <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {services.map((service) => {
                    const isSelected = form.speciality.includes(service._id);

                    return (
                      <button
                        key={service._id}
                        type="button"
                        onClick={() => toggleSpeciality(service._id)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                          isSelected
                            ? "border-[#173C82] bg-[#F4F7FC] text-[#173C82]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5]"
                        }`}
                      >
                        {service.name.en}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedServices.length > 0 && (
                <p className="mt-2 text-[11px] font-medium text-[#F45A2A]">
                  {selectedServices.length} service
                  {selectedServices.length > 1 ? "s" : ""} assigned
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Working days
              </label>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {allDays.map((day) => {
                  const isSelected = form.workingDays.includes(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                        isSelected
                          ? "border-[#F45A2A] bg-[#FFF4F0] text-[#D9481D]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5]"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Start time
                </label>

                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  End time
                </label>

                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endTime: event.target.value,
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
                  Break start
                </label>

                <input
                  type="time"
                  value={form.breakStart}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      breakStart: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Break end
                </label>

                <input
                  type="time"
                  value={form.breakEnd}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      breakEnd: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={
                  submitting || loadingServices || services.length === 0
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#173C82] py-2.5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(23,60,130,0.18)] transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#F45A2A]" />
                ) : isEditing ? (
                  <PencilLine className="h-4 w-4 text-[#F45A2A]" />
                ) : (
                  <Plus className="h-4 w-4 text-[#F45A2A]" />
                )}

                {isEditing ? "Save changes" : "Create profile"}
              </button>

              {isEditing && (
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
                Team Directory
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#173C82]">
                Active beauticians
              </h3>
            </div>

            <span className="rounded-full bg-[#F4F7FC] px-3 py-1 text-xs font-bold text-[#173C82]">
              {staffList.length} members
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#173C82]" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                No beautician profiles have been created yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {staffList.map((staff) => (
                <article
                  key={staff._id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#F8FAFE] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F4F7FC] text-sm font-bold text-[#173C82]">
                        {staff.photo ? (
                          <img
                            src={staff.photo}
                            alt={staff.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          staff.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-slate-800">
                          {staff.name}
                        </h4>

                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          {staff.email || staff.phone || "Salon beautician"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-[#F45A2A]" />
                        {staff.workingHours.startTime} -{" "}
                        {staff.workingHours.endTime}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[#F45A2A]" />
                        {staff.workingDays.join(", ")}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {staff.speciality.map((service) => (
                        <span
                          key={service._id}
                          className="rounded-md bg-[#FFF4F0] px-2 py-1 text-[10px] font-bold text-[#D9481D]"
                        >
                          {service.name.en}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(staff)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#173C82]/15 bg-white text-[#173C82] transition hover:bg-[#F4F7FC]"
                      title="Edit beautician"
                      aria-label={`Edit ${staff.name}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteClick(staff)}
                      disabled={deletingId === staff._id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Delete beautician"
                      aria-label={`Delete ${staff.name}`}
                    >
                      {deletingId === staff._id ? (
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
