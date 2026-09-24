import React, { useContext, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Scissors,
  Sparkles,
} from "lucide-react";
import {
  salonService,
  type SalonCategory,
  type SalonServiceItem,
} from "../../services/salon/salonService";
import { ServiceCard } from "../../components/salon/ServiceCard";
import { BookingModal } from "../../components/salon/BookingModal";
import { CheckoutPayment } from "../../components/salon/CheckoutPayment";
import { AuthContext } from "../../context/AuthContext";

const categories: Array<{ value: SalonCategory | ""; label: string }> = [
  { value: "", label: "All Services" },
  { value: "Hair", label: "Hair" },
  { value: "Nails", label: "Nails" },
  { value: "Skin", label: "Skin" },
  { value: "Makeup", label: "Makeup" },
  { value: "Massage", label: "Massage" },
];

interface CheckoutData {
  id: string;
  price: number;
  name: string;
  whatsappUrl?: string | null;
}

export const SalonCatalogPage: React.FC = () => {
  const auth = useContext(AuthContext);

  const [services, setServices] = useState<SalonServiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SalonCategory | "">(
    "",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeService, setActiveService] = useState<SalonServiceItem | null>(
    null,
  );
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  const loadServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await salonService.getServices(
        selectedCategory || undefined,
      );

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
  }, [selectedCategory]);

  if (checkoutData) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setCheckoutData(null)}
            className="text-xs font-bold text-[#173C82] transition hover:text-[#F45A2A]"
          >
            Back To Services
          </button>
        </div>

        <CheckoutPayment
          bookingId={checkoutData.id}
          amount={checkoutData.price}
          serviceName={checkoutData.name}
          customerName={auth?.user?.name || "OmniBiz Customer"}
          onPaymentComplete={() => setCheckoutData(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="relative overflow-hidden rounded-xl border border-[#DCE7FA] bg-linear-to-br from-[#F4F7FC] via-white to-[#FFF8F5] px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#173C82]">
            <Sparkles className="h-4 w-4 text-[#F45A2A]" />
            <span className="text-[11px]  font-bold uppercase tracking-wide">
              OmniBiz <span className="text-[#F45A2A]">Salon</span> 
            </span>
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#173C82] sm:text-3xl">
            Beauty <span className="text-[#F45A2A]">Services</span> 
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[14px]">
            Explore our salon treatments, choose your preferred beautician and
            book an appointment at a time that works for you.
          </p>
        </div>

        <div className="absolute -right-8 -top-10 hidden h-48 w-48 rounded-full border-28 border-[#173C82]/5 sm:block" />
        <div className="absolute -bottom-12 right-20 hidden h-32 w-32 rounded-full border-22 border-[#F45A2A]/10 sm:block" />
      </section>

      <div className="mt-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = selectedCategory === category.value;

            return (
              <button
                key={category.value || "all"}
                type="button"
                onClick={() => setSelectedCategory(category.value)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                  isActive
                    ? "border-[#173C82] bg-[#173C82] text-white shadow-[0_5px_12px_rgba(23,60,130,0.16)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5] hover:text-[#D9481D]"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void loadServices()}
          disabled={loading}
          className="inline-flex items-center rounded-md justify-center p-2 bg-[#173C82] transition hover:text-[#F45A2A] text-white disabled:opacity-60"
        >
          <RefreshCw className={`h-5 w-5   ${loading ? "animate-spin" : ""}`} />
          
        </button>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-[#173C82]" />
            <span className="text-sm font-semibold text-slate-500">
              Loading salon services...
            </span>
          </div>
        </div>
      ) : services.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FC]">
            <Scissors className="h-6 w-6 text-[#173C82]" />
          </div>

          <h3 className="mt-4 text-lg font-bold text-[#173C82]">
            No services found
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            There are no active services in this category at the moment.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              onSelect={(selectedService) => {
                setActiveService(selectedService);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <BookingModal
        service={activeService}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveService(null);
        }}
        onProceedToPayment={(id, price, name) => {
          setIsModalOpen(false);
          setActiveService(null);
          setCheckoutData({ id, price, name });
        }}
      />
    </div>
  );
};
