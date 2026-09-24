import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  SalonServiceItem,
  StaffItem,
  StaffWorkingHours,
} from "./salonService";

const API_URL = "http://localhost:5000/api/salon/staff";

export interface CreateStaffPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  speciality: string[];
  workingDays: string[];
  workingHours: StaffWorkingHours;
  photo?: string | null;
  isActive?: boolean;
}

export type UpdateStaffPayload = Partial<CreateStaffPayload>;

export interface StaffWithSpeciality extends Omit<StaffItem, "speciality"> {
  speciality: SalonServiceItem[];
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

export const staffService = {
  async getAllStaff(): Promise<
    ApiSuccessResponse<{ staff: StaffWithSpeciality[] }>
  > {
    return request("/");
  },

  async addStaff(
    payload: CreateStaffPayload,
  ): Promise<ApiSuccessResponse<{ staff: StaffWithSpeciality }>> {
    return request("/add", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateStaff(
    id: string,
    payload: UpdateStaffPayload,
  ): Promise<ApiSuccessResponse<{ staff: StaffWithSpeciality }>> {
    return request(`/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async deleteStaff(id: string): Promise<ApiSuccessResponse<null>> {
    return request(`/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },
};
