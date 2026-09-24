const API_URL = "http://localhost:5000/api/hajj";

export type PackageType = "Hajj" | "Umrah";
export type PackageTier = "Economy" | "Executive" | "VIP";

export type HajjBookingStatus =
  | "Pending"
  | "Reviewed"
  | "Confirmed"
  | "Rejected"
  | "Cancelled"
  | "Completed";

export type PaymentMethod = "Cash" | "Mada" | "Visa" | "ApplePay" | "Pending";

export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface ApiErrorResponse {
  status: "fail" | "error";
  message: string;
}

export interface ApiSuccessResponse<T> {
  status: "success";
  message?: string;
  results?: number;
  data: T;
}

export interface HajjPackageItem {
  _id: string;
  title: LocalizedText;
  packageType: PackageType;
  tier: PackageTier;
  price: number;
  discountedPrice: number | null;
  durationDays: number;
  departureCity?: string | null;
  images: string[];
  description: LocalizedText;
  features: LocalizedText[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HajjBookingCustomer {
  _id?: string;
  name: string;
  email?: string;
  phone?: string | null;
}

export interface HajjBookingItem {
  _id: string;
  customer: HajjBookingCustomer;
  package: HajjPackageItem;
  numberOfPilgrims: number;
  departureDate: string;
  pricePerPilgrim: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string | null;
  status: HajjBookingStatus;
  adminResponse?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  customerWhatsAppUrl?: string | null;
  adminWhatsAppUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePackagePayload {
  title: LocalizedText;
  packageType: PackageType;
  tier: PackageTier;
  price: number;
  discountedPrice?: number | null;
  durationDays: number;
  departureCity?: string | null;
  images?: string[];
  description?: Partial<LocalizedText>;
  features?: LocalizedText[];
  isActive?: boolean;
}

export type UpdatePackagePayload = Partial<CreatePackagePayload>;

export interface CreateHajjBookingPayload {
  packageId: string;
  numberOfPilgrims: number;
  departureDate: string;
  paymentMethod?: PaymentMethod;
  notes?: string | null;
}

export interface UpdateHajjBookingPayload {
  status?: HajjBookingStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  adminResponse?: string;
  cancellationReason?: string;
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

export const hajjService = {
  async getPackages(params?: {
    type?: PackageType;
    tier?: PackageTier;
  }): Promise<ApiSuccessResponse<{ packages: HajjPackageItem[] }>> {
    const searchParams = new URLSearchParams();

    if (params?.type) {
      searchParams.set("type", params.type);
    }

    if (params?.tier) {
      searchParams.set("tier", params.tier);
    }

    const query = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";

    return request(`/packages${query}`);
  },

  async addPackage(
    payload: CreatePackagePayload,
  ): Promise<ApiSuccessResponse<{ package: HajjPackageItem }>> {
    return request("/packages/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updatePackage(
    id: string,
    payload: UpdatePackagePayload,
  ): Promise<ApiSuccessResponse<{ package: HajjPackageItem }>> {
    return request(`/packages/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async deletePackage(
    id: string,
  ): Promise<ApiSuccessResponse<{ package: HajjPackageItem }>> {
    return request(`/packages/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async submitBooking(
    payload: CreateHajjBookingPayload,
  ): Promise<
    ApiSuccessResponse<{
      booking: HajjBookingItem;
      customerWhatsAppUrl?: string | null;
      adminWhatsAppUrl?: string | null;
    }>
  > {
    return request("/bookings/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async getAllBookings(params?: {
    status?: HajjBookingStatus;
  }): Promise<ApiSuccessResponse<{ bookings: HajjBookingItem[] }>> {
    const query = params?.status
      ? `?status=${encodeURIComponent(params.status)}`
      : "";

    return request(`/bookings${query}`, {
      headers: getAuthHeaders(),
    });
  },

  async updateBooking(
    id: string,
    payload: UpdateHajjBookingPayload,
  ): Promise<
    ApiSuccessResponse<{
      booking: HajjBookingItem;
      customerWhatsAppUrl?: string | null;
    }>
  > {
    return request(`/bookings/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async cancelMyBooking(
    id: string,
    cancellationReason?: string,
  ): Promise<ApiSuccessResponse<{ booking: HajjBookingItem }>> {
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
};