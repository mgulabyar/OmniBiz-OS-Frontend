const API_URL = "http://localhost:5000/api/rental";

export type PropertyType = "Apartment" | "Studio" | "Villa" | "Room";

export type RentalBookingStatus =
  | "Pending"
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

export interface ApartmentItem {
  _id: string;
  title: LocalizedText;
  propertyType: PropertyType;
  roomsCount: number;
  maxGuests: number;
  bedsCount: number;
  bathroomsCount: number;
  amenities: LocalizedText[];
  description: LocalizedText;
  pricePerNight: number;
  cleaningFee: number;
  googleMapUrl: string;
  locationName?: string | null;
  images: string[];
  isAvailable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RentalBookingCustomer {
  _id?: string;
  name: string;
  email?: string;
  phone?: string | null;
}

export interface RentalBookingItem {
  _id: string;
  customer: RentalBookingCustomer;
  apartment: ApartmentItem;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalNights: number;
  pricePerNight: number;
  cleaningFee: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string | null;
  bookingStatus: RentalBookingStatus;
  adminResponse?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  specialRequests?: string | null;
  customerWhatsAppUrl?: string | null;
  adminWhatsAppUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateApartmentPayload {
  title: LocalizedText;
  propertyType?: PropertyType;
  roomsCount: number;
  maxGuests: number;
  bedsCount?: number;
  bathroomsCount?: number;
  amenities?: LocalizedText[];
  description?: Partial<LocalizedText>;
  pricePerNight: number;
  cleaningFee?: number;
  googleMapUrl: string;
  locationName?: string | null;
  images?: string[];
  isAvailable?: boolean;
  isActive?: boolean;
}

export type UpdateApartmentPayload = Partial<CreateApartmentPayload>;

export interface CreateRentalBookingPayload {
  apartmentId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  paymentMethod?: PaymentMethod;
  specialRequests?: string | null;
}

export interface UpdateRentalBookingPayload {
  bookingStatus?: RentalBookingStatus;
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

export const rentalService = {
  async getApartments(params?: {
    propertyType?: PropertyType;
    guests?: number;
  }): Promise<ApiSuccessResponse<{ apartments: ApartmentItem[] }>> {
    const searchParams = new URLSearchParams();

    if (params?.propertyType) {
      searchParams.set("propertyType", params.propertyType);
    }

    if (params?.guests) {
      searchParams.set("guests", String(params.guests));
    }

    const query = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";

    return request(`/apartments${query}`);
  },

  async addApartment(
    payload: CreateApartmentPayload,
  ): Promise<ApiSuccessResponse<{ apartment: ApartmentItem }>> {
    return request("/apartments/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateApartment(
    id: string,
    payload: UpdateApartmentPayload,
  ): Promise<ApiSuccessResponse<{ apartment: ApartmentItem }>> {
    return request(`/apartments/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async deleteApartment(
    id: string,
  ): Promise<ApiSuccessResponse<{ apartment: ApartmentItem }>> {
    return request(`/apartments/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async submitBooking(
    payload: CreateRentalBookingPayload,
  ): Promise<
    ApiSuccessResponse<{
      booking: RentalBookingItem;
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
    status?: RentalBookingStatus;
  }): Promise<ApiSuccessResponse<{ bookings: RentalBookingItem[] }>> {
    const query = params?.status
      ? `?status=${encodeURIComponent(params.status)}`
      : "";

    return request(`/bookings${query}`, {
      headers: getAuthHeaders(),
    });
  },

  async updateRentalBooking(
    id: string,
    payload: UpdateRentalBookingPayload,
  ): Promise<
    ApiSuccessResponse<{
      booking: RentalBookingItem;
      customerWhatsAppUrl?: string | null;
    }>
  > {
    return request(`/bookings/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async cancelMyRentalBooking(
    id: string,
    cancellationReason?: string,
  ): Promise<ApiSuccessResponse<{ booking: RentalBookingItem }>> {
    return request(`/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        cancellationReason,
      }),
    });
  },

  async deleteRentalBooking(id: string): Promise<ApiSuccessResponse<null>> {
    return request(`/bookings/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },
};