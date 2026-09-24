const API_URL = "http://localhost:5000/api/catering";

export type CateringCategory =
  | "Appetizer"
  | "Main Course"
  | "Dessert"
  | "Beverage";

export type CateringEventType =
  | "Wedding"
  | "Corporate"
  | "Birthday Party"
  | "Private Dinner"
  | "Other";

export type CateringBookingStatus =
  | "Pending Inquiry"
  | "Quotation Sent"
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

export interface CateringMenuItem {
  _id: string;
  itemName: LocalizedText;
  category: CateringCategory;
  pricePerPerson: number;
  description: LocalizedText;
  image?: string | null;
  dietaryTags: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CateringItemSnapshot {
  menuItem: string;
  nameEn: string;
  nameAr: string;
  category: CateringCategory;
  pricePerPerson: number;
}

export interface CateringBookingCustomer {
  _id?: string;
  name: string;
  email?: string;
  phone?: string | null;
}

export interface CateringBookingItem {
  _id: string;
  customer: CateringBookingCustomer;
  eventDate: string;
  eventTime?: string | null;
  venueLocation: string;
  guestCount: number;
  selectedItems: CateringMenuItem[];
  selectedItemSnapshots?: CateringItemSnapshot[];
  eventType: CateringEventType;
  estimatedPricePerPerson: number;
  totalEstimatedCost: number;
  quotedAmount?: number | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: CateringBookingStatus;
  adminResponse?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  customerWhatsAppUrl?: string | null;
  adminWhatsAppUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuItemPayload {
  itemName: LocalizedText;
  category: CateringCategory;
  pricePerPerson: number;
  description?: Partial<LocalizedText>;
  image?: string | null;
  dietaryTags?: string[];
  isActive?: boolean;
}

export type UpdateMenuItemPayload = Partial<CreateMenuItemPayload>;

export interface CreateCateringBookingPayload {
  eventDate: string;
  eventTime?: string | null;
  venueLocation: string;
  guestCount: number;
  selectedItems: string[];
  eventType: CateringEventType;
  notes?: string | null;
}

export interface UpdateCateringBookingPayload {
  status?: CateringBookingStatus;
  quotedAmount?: number | null;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
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

export const cateringService = {
  async getMenu(
    category?: CateringCategory,
  ): Promise<ApiSuccessResponse<{ menuItems: CateringMenuItem[] }>> {
    const query = category
      ? `?category=${encodeURIComponent(category)}`
      : "";

    return request(`/menu${query}`);
  },

  async addMenuItem(
    payload: CreateMenuItemPayload,
  ): Promise<ApiSuccessResponse<{ menuItem: CateringMenuItem }>> {
    return request("/menu/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateMenuItem(
    id: string,
    payload: UpdateMenuItemPayload,
  ): Promise<ApiSuccessResponse<{ menuItem: CateringMenuItem }>> {
    return request(`/menu/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async deleteMenuItem(
    id: string,
  ): Promise<ApiSuccessResponse<{ menuItem: CateringMenuItem }>> {
    return request(`/menu/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async submitCateringBooking(
    payload: CreateCateringBookingPayload,
  ): Promise<
    ApiSuccessResponse<{
      booking: CateringBookingItem;
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
    status?: CateringBookingStatus;
  }): Promise<ApiSuccessResponse<{ bookings: CateringBookingItem[] }>> {
    const query = params?.status
      ? `?status=${encodeURIComponent(params.status)}`
      : "";

    return request(`/bookings${query}`, {
      headers: getAuthHeaders(),
    });
  },

  async updateCateringBooking(
    id: string,
    payload: UpdateCateringBookingPayload,
  ): Promise<
    ApiSuccessResponse<{
      booking: CateringBookingItem;
      customerWhatsAppUrl?: string | null;
    }>
  > {
    return request(`/bookings/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async cancelMyCateringBooking(
    id: string,
    cancellationReason?: string,
  ): Promise<ApiSuccessResponse<{ booking: CateringBookingItem }>> {
    return request(`/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        cancellationReason,
      }),
    });
  },

  async deleteCateringBooking(id: string): Promise<ApiSuccessResponse<null>> {
    return request(`/bookings/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },
};