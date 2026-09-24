const API_URL = "http://localhost:5000/api/transport";

export type VehicleType =
  | "Sedan"
  | "SUV"
  | "Luxury Bus"
  | "Mini Van"
  | "Coaster";

export type TripType = "OneWay" | "RoundTrip" | "DailyRental";

export type InquiryStatus =
  | "Pending"
  | "Reviewed"
  | "Approved"
  | "Rejected"
  | "Cancelled";

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

export interface VehicleItem {
  _id: string;
  name: LocalizedText;
  vehicleType: VehicleType;
  capacity: number;
  pricePerDay: number;
  images: string[];
  description?: LocalizedText;
  features: string[];
  hasAirConditioning: boolean;
  luggageCapacity: number;
  isAvailable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InquiryCustomer {
  _id?: string;
  name: string;
  email?: string;
  phone?: string | null;
}

export interface TransportInquiryItem {
  _id: string;
  customer: InquiryCustomer;
  vehicle: VehicleItem;
  tripType: TripType;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: string;
  endDate: string;
  pickupTime?: string | null;
  passengers: number;
  status: InquiryStatus;
  quotedAmount?: number | null;
  adminResponse?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  customerWhatsAppUrl?: string | null;
  adminWhatsAppUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehiclePayload {
  name: LocalizedText;
  vehicleType: VehicleType;
  capacity: number;
  pricePerDay: number;
  images?: string[];
  description?: Partial<LocalizedText>;
  features?: string[];
  hasAirConditioning?: boolean;
  luggageCapacity?: number;
  isAvailable?: boolean;
  isActive?: boolean;
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export interface CreateTransportInquiryPayload {
  vehicle: string;
  tripType: TripType;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: string;
  endDate: string;
  pickupTime?: string | null;
  passengers: number;
  notes?: string | null;
}

export interface UpdateTransportInquiryPayload {
  status?: InquiryStatus;
  quotedAmount?: number | null;
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

export const transportService = {
  async getVehicles(params?: {
    type?: VehicleType;
    minCapacity?: number;
  }): Promise<ApiSuccessResponse<{ vehicles: VehicleItem[] }>> {
    const searchParams = new URLSearchParams();

    if (params?.type) {
      searchParams.set("type", params.type);
    }

    if (params?.minCapacity) {
      searchParams.set("minCapacity", String(params.minCapacity));
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

    return request(`/vehicles${query}`);
  },

  async addVehicle(
    payload: CreateVehiclePayload,
  ): Promise<ApiSuccessResponse<{ vehicle: VehicleItem }>> {
    return request("/vehicles/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateVehicle(
    id: string,
    payload: UpdateVehiclePayload,
  ): Promise<ApiSuccessResponse<{ vehicle: VehicleItem }>> {
    return request(`/vehicles/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async deleteVehicle(
    id: string,
  ): Promise<ApiSuccessResponse<{ vehicle: VehicleItem }>> {
    return request(`/vehicles/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async getAllInquiries(params?: {
    status?: InquiryStatus;
  }): Promise<ApiSuccessResponse<{ inquiries: TransportInquiryItem[] }>> {
    const query = params?.status
      ? `?status=${encodeURIComponent(params.status)}`
      : "";

    return request(`/inquiries${query}`, {
      headers: getAuthHeaders(),
    });
  },

  async submitInquiry(payload: CreateTransportInquiryPayload): Promise<
    ApiSuccessResponse<{
      inquiry: TransportInquiryItem;
      customerWhatsAppUrl?: string | null;
      adminWhatsAppUrl?: string | null;
    }>
  > {
    return request("/inquiries/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateInquiry(
    id: string,
    payload: UpdateTransportInquiryPayload,
  ): Promise<
    ApiSuccessResponse<{
      inquiry: TransportInquiryItem;
      customerWhatsAppUrl?: string | null;
    }>
  > {
    return request(`/inquiries/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async cancelMyInquiry(
    id: string,
    cancellationReason?: string,
  ): Promise<ApiSuccessResponse<{ inquiry: TransportInquiryItem }>> {
    return request(`/inquiries/${id}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        cancellationReason,
      }),
    });
  },

  async deleteInquiry(id: string): Promise<ApiSuccessResponse<null>> {
    return request(`/inquiries/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },
};
