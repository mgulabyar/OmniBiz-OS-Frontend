import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import {
  salonService,
  type PaymentMethod,
} from "../../services/salon/salonService";

interface CheckoutPaymentProps {
  bookingId: string;
  serviceName: string;
  amount: number;
  customerName: string;
  onPaymentComplete: () => void;
}

type OnlinePaymentMethod = Extract<
  PaymentMethod,
  "Mada" | "Visa" | "ApplePay"
>;

export const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({
  bookingId,
  serviceName,
  amount,
  customerName,
  onPaymentComplete,
}) => {
  const [paymentMethod, setPaymentMethod] =
    useState<OnlinePaymentMethod>("Mada");
  const [isInitializing, setIsInitializing] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const handleInitializeCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setIsInitializing(true);

    try {
      const response = await salonService.initializeCheckout(
        bookingId,
        paymentMethod,
      );

      setCheckoutReady(true);
      setWhatsappUrl(response.data.whatsappUrl || null);
    } catch (requestError) {
      setErrorMessage(
        requestError instanceof Error
          ? requestError.message
          : "Unable to initialize checkout. Please try again.",
      );
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="mx-auto mt-6 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
      {checkoutReady ? (
        <div className="space-y-5 px-6 py-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4F0]">
            <CheckCircle2 className="h-7 w-7 text-[#F45A2A]" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#F45A2A]">
              Booking Created
            </p>

            <h3 className="mt-1 text-xl font-bold text-[#173C82]">
              Payment Checkout Ready
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Booking created for {serviceName}. Currently using test payment mode.
            </p>
          </div>

          <div className="rounded-xl border border-[#DCE7FA] bg-[#F4F7FC] p-4 text-left">
            <div className="flex items-center justify-between border-b border-[#DCE7FA] pb-3">
              <span className="text-xs font-semibold text-slate-500">
                Booking Reference
              </span>

              <span className="max-w-47.5 truncate text-xs font-bold text-[#173C82]">
                {bookingId}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs font-semibold text-slate-500">
                Payment Method
              </span>

              <span className="text-xs font-bold text-[#173C82]">
                {paymentMethod === "ApplePay" ? "Apple Pay" : paymentMethod}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Amount
              </span>

              <span className="text-sm font-bold text-[#173C82]">
                SAR {amount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="rounded-xl text-center border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
Development checkout. No real cards or personal payment details are collected for testing purposes.          </div>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F45A2A] py-3 text-sm font-bold text-white shadow-[0_6px_14px_rgba(244,90,42,0.20)] transition hover:bg-[#D9481D]"
            >
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp Booking Message
            </a>
          )}

          <button
            type="button"
            onClick={onPaymentComplete}
            className="text-xs font-bold text-[#173C82] transition hover:text-[#F45A2A]"
          >
            Return to Salon Services
          </button>
        </div>
      ) : (
        <form onSubmit={handleInitializeCheckout} className="space-y-5 p-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F7FC] text-[#173C82]">
                <CreditCard className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#F45A2A]">
                  Checkout
                </p>

                <h3 className="text-md font-bold text-[#173C82]">
                  Select Payment Method
                </h3>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE7FA] bg-[#F4F7FC] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Appointment
            </p>

            <p className="mt-1 text-sm font-bold text-[#173C82]">
              {serviceName}
            </p>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Customer
              </span>

              <span className="text-xs font-bold text-slate-700">
                {customerName}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Payable Amount
              </span>

              <span className="text-md font-bold text-[#173C82]">
                SAR {amount.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Choose a Method
            </label>

            <div className="grid grid-cols-3 gap-2">
              {(["Mada", "Visa", "ApplePay"] as OnlinePaymentMethod[]).map(
                (method) => {
                  const isSelected = paymentMethod === method;

                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-lg border px-2 py-2.5 text-xs font-bold transition ${
                        isSelected
                          ? "border-[#F45A2A] bg-[#FFF4F0] text-[#D9481D]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#F45A2A]/40 hover:bg-[#FFF8F5]"
                      }`}
                    >
                      {method === "ApplePay" ? "Apple Pay" : method}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-2.5 text-xs font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isInitializing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] py-3.5 text-sm font-bold text-white shadow-[0_7px_16px_rgba(23,60,130,0.20)] transition hover:bg-[#102D63] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isInitializing ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#F45A2A]" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-[#F45A2A]" />
            )}

            <span>
              {isInitializing
                ? "Preparing secure checkout..."
                : `Continue with ${paymentMethod === "ApplePay" ? "Apple Pay" : paymentMethod}`}
            </span>
          </button>

          <p className="text-center text-[11px] leading-5 text-slate-400">
            OmniBiz does not collect card information in the current demo
            payment flow.
          </p>
        </form>
      )}
    </div>
  );
};