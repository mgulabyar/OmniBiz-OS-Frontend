const API_URL = "http://localhost:5000/api/salon";

export type SalonCategory = "Hair" | "Nails" | "Skin" | "Makeup" | "Massage";

export type PaymentMethod = "Cash" | "Mada" | "Visa" | "ApplePay" | "Pending";

export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

export type BookingStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed";

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface ApiErrorResponse {
  status: "fail" | "error";
  message: string;
}

export interface SalonServiceItem {
  _id: string;
  name: LocalizedText;
  category: SalonCategory;
  price: number;
  discountedPrice: number | null;
  durationMinutes: number;
  description?: LocalizedText;
  images: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffWorkingHours {
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

export interface StaffItem {
  _id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  speciality: SalonServiceItem[];
  workingDays: string[];
  workingHours: StaffWorkingHours;
  photo?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingCustomer {
  _id?: string;
  name: string;
  email?: string;
  phone?: string | null;
}

export interface BookingService {
  _id?: string;
  name: LocalizedText;
  price: number;
  discountedPrice?: number | null;
  durationMinutes?: number;
}

export interface BookingStaff {
  _id?: string;
  name: string;
  phone?: string | null;
}

export interface BookingItem {
  _id: string;
  customer: BookingCustomer;
  staff: BookingStaff;
  service: BookingService;
  bookingDate: string;
  timeSlot: string;
  endTime: string;
  durationMinutes: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string | null;
  bookingStatus: BookingStatus;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  reminderSent?: boolean;
  reminderPreparedAt?: string | null;
  reminderWhatsAppUrl?: string | null;
  confirmationWhatsAppUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

export interface CreateBookingPayload {
  staff: string;
  service: string;
  bookingDate: string;
  timeSlot: string;
  paymentMethod?: PaymentMethod;
}

export interface UpdateBookingPayload {
  bookingStatus?: BookingStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  cancellationReason?: string;
}

export interface CreateServicePayload {
  name: LocalizedText;
  category: SalonCategory;
  price: number;
  discountedPrice?: number | null;
  durationMinutes: number;
  description?: Partial<LocalizedText>;
  images?: string[];
  isActive?: boolean;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export  interface ApiSuccessResponse<T> {
  status: "success";
  message?: string;
  results?: number;
  data: T;
}

interface BookingSuccessData {
  booking: BookingItem;
  whatsappUrl?: string | null;
}

interface CheckoutData {
  whatsappUrl: null;
  bookingId: string;
  amount: number;
  currency: "SAR";
  paymentMethod: PaymentMethod;
  mockConfirmationEndpoint: string;
}

const getAuthHeaders = (withJsonContent = false): HeadersInit => {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {};

  if (withJsonContent) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorData = (await response.json()) as Partial<ApiErrorResponse>;

    return errorData.message || "Something went wrong. Please try again.";
  } catch {
    return `Request failed with status ${response.status}.`;
  }
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
};

export const salonService = {
  async getServices(
    category?: SalonCategory,
  ): Promise<ApiSuccessResponse<{ services: SalonServiceItem[] }>> {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";

    return request(`/services${query}`);
  },

  async addService(
    payload: CreateServicePayload,
  ): Promise<ApiSuccessResponse<{ service: SalonServiceItem }>> {
    return request("/services/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateService(
    id: string,
    payload: UpdateServicePayload,
  ): Promise<ApiSuccessResponse<{ service: SalonServiceItem }>> {
    return request(`/services/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async deleteService(id: string): Promise<ApiSuccessResponse<null>> {
    return request(`/services/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async getAllStaff(): Promise<ApiSuccessResponse<{ staff: StaffItem[] }>> {
    return request("/staff");
  },

  async getBookings(params?: {
    status?: BookingStatus;
    date?: string;
  }): Promise<ApiSuccessResponse<{ bookings: BookingItem[] }>> {
    const searchParams = new URLSearchParams();

    if (params?.status) {
      searchParams.set("status", params.status);
    }

    if (params?.date) {
      searchParams.set("date", params.date);
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

    return request(`/bookings${query}`, {
      headers: getAuthHeaders(),
    });
  },

  async getAvailableSlots(
    staffId: string,
    serviceId: string,
    date: string,
  ): Promise<ApiSuccessResponse<{ slots: AvailableSlot[] }>> {
    const searchParams = new URLSearchParams({
      staffId,
      serviceId,
      date,
    });

    return request(`/bookings/available-slots?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
  },

  async createBooking(
    payload: CreateBookingPayload,
  ): Promise<ApiSuccessResponse<BookingSuccessData>> {
    return request("/bookings/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateBooking(
    id: string,
    payload: UpdateBookingPayload,
  ): Promise<ApiSuccessResponse<BookingSuccessData>> {
    return request(`/bookings/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async cancelMyBooking(
    id: string,
    cancellationReason?: string,
  ): Promise<ApiSuccessResponse<{ booking: BookingItem }>> {
    return request(`/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        cancellationReason,
      }),
    });
  },

  async deleteBooking(id: string): Promise<ApiSuccessResponse<null>> {
    return request(`/bookings/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async initializeCheckout(
    bookingId: string,
    paymentMethod: Extract<PaymentMethod, "Mada" | "Visa" | "ApplePay">,
  ): Promise<ApiSuccessResponse<CheckoutData>> {
    return request("/payments/checkout", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        bookingId,
        paymentMethod,
      }),
    });
  },

  async confirmMockPayment(
    bookingId: string,
    transactionId?: string,
  ): Promise<ApiSuccessResponse<BookingSuccessData>> {
    return request("/payments/mock-confirm", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        bookingId,
        transactionId,
      }),
    });
  },
};
