const API_URL = "http://localhost:5000/api/dynamic-core";

export type WorkflowType =
  | "SlotBooking"
  | "DateRangeBooking"
  | "InquiryOnly"
  | "RFQEngine";

export type DynamicFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "textarea"
  | "email"
  | "phone";

export type DynamicSubmissionStatus =
  | "Pending"
  | "Reviewed"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type DynamicPaymentMethod =
  | "Mada"
  | "Visa/Mastercard"
  | "Apple Pay"
  | "Cash"
  | "Bank Transfer";

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

export interface BusinessBranch {
  _id?: string;
  name: LocalizedText;
  location: string;
  phone?: string | null;
  isActive?: boolean;
}

export interface BusinessModuleItem {
  _id: string;
  name: LocalizedText;
  slug: string;
  businessCategory: string;
  description: LocalizedText;
  workflowType: WorkflowType;
  branches: BusinessBranch[];
  paymentMethodsAllowed: DynamicPaymentMethod[];
  contactWhatsAppNumber?: string | null;
  icon?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicFormField {
  _id?: string;
  fieldKey: string;
  label: LocalizedText;
  fieldType: DynamicFieldType;
  placeholder?: LocalizedText;
  isRequired: boolean;
  options: string[];
  order: number;
}

export interface DynamicFormItem {
  _id: string;
  businessModule:
    | string
    | Pick<BusinessModuleItem, "_id" | "name" | "slug">;
  formTitle: LocalizedText;
  formDescription: LocalizedText;
  fields: DynamicFormField[];
  successMessage: LocalizedText;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicSubmissionAnswer {
  fieldKey: string;
  label: LocalizedText;
  value: string;
}

export interface DynamicSubmissionCustomer {
  _id?: string;
  name: string;
  email?: string;
  phone?: string | null;
}

export interface DynamicSubmissionItem {
  _id: string;
  customer: DynamicSubmissionCustomer;
  businessModule:
    | string
    | Pick<
        BusinessModuleItem,
        "_id" | "name" | "slug" | "workflowType"
      >;
  form: string | Pick<DynamicFormItem, "_id" | "formTitle">;
  answers: DynamicSubmissionAnswer[];
  status: DynamicSubmissionStatus;
  adminResponse?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  customerWhatsAppUrl?: string | null;
  adminWhatsAppUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessPayload {
  name: LocalizedText;
  slug: string;
  businessCategory: string;
  description?: Partial<LocalizedText>;
  workflowType: WorkflowType;
  branches?: BusinessBranch[];
  paymentMethodsAllowed?: DynamicPaymentMethod[];
  contactWhatsAppNumber?: string | null;
  icon?: string;
  isActive?: boolean;
}

export type UpdateBusinessPayload = Partial<CreateBusinessPayload>;

export interface CreateDynamicFormPayload {
  businessModule: string;
  formTitle: LocalizedText;
  formDescription?: Partial<LocalizedText>;
  fields: DynamicFormField[];
  successMessage?: Partial<LocalizedText>;
  isActive?: boolean;
}

export type UpdateDynamicFormPayload = Partial<CreateDynamicFormPayload>;

export interface UpdateDynamicSubmissionPayload {
  status?: DynamicSubmissionStatus;
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

export const dynamicService = {
  async getActiveEcosystem(): Promise<
    ApiSuccessResponse<{ ecosystems: BusinessModuleItem[] }>
  > {
    return request("/ecosystem");
  },

  async getAdminBusinesses(): Promise<
    ApiSuccessResponse<{ businesses: BusinessModuleItem[] }>
  > {
    return request("/admin/businesses", {
      headers: getAuthHeaders(),
    });
  },

  async createBusiness(
    payload: CreateBusinessPayload,
  ): Promise<ApiSuccessResponse<{ business: BusinessModuleItem }>> {
    return request("/create-division", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateBusiness(
    id: string,
    payload: UpdateBusinessPayload,
  ): Promise<ApiSuccessResponse<{ business: BusinessModuleItem }>> {
    return request(`/businesses/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async deleteBusiness(
    id: string,
  ): Promise<ApiSuccessResponse<{ business: BusinessModuleItem }>> {
    return request(`/businesses/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async getFormsByBusiness(
    businessId: string,
  ): Promise<ApiSuccessResponse<{ forms: DynamicFormItem[] }>> {
    return request(`/businesses/${businessId}/forms`, {
      headers: getAuthHeaders(),
    });
  },

  async getAdminForms(): Promise<
    ApiSuccessResponse<{ forms: DynamicFormItem[] }>
  > {
    return request("/admin/forms", {
      headers: getAuthHeaders(),
    });
  },

  async createForm(
    payload: CreateDynamicFormPayload,
  ): Promise<ApiSuccessResponse<{ form: DynamicFormItem }>> {
    return request("/configure-form", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async updateForm(
    id: string,
    payload: UpdateDynamicFormPayload,
  ): Promise<ApiSuccessResponse<{ form: DynamicFormItem }>> {
    return request(`/forms/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async deleteForm(
    id: string,
  ): Promise<ApiSuccessResponse<{ form: DynamicFormItem }>> {
    return request(`/forms/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async submitDynamicForm(payload: {
    businessModuleId: string;
    formId: string;
    answers: Record<string, string>;
  }): Promise<
    ApiSuccessResponse<{
      submission: DynamicSubmissionItem;
      customerWhatsAppUrl?: string | null;
      adminWhatsAppUrl?: string | null;
    }>
  > {
    return request("/submissions", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async getSubmissions(params?: {
    status?: DynamicSubmissionStatus;
    businessModuleId?: string;
  }): Promise<ApiSuccessResponse<{ submissions: DynamicSubmissionItem[] }>> {
    const searchParams = new URLSearchParams();

    if (params?.status) {
      searchParams.set("status", params.status);
    }

    if (params?.businessModuleId) {
      searchParams.set("businessModuleId", params.businessModuleId);
    }

    const query = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";

    return request(`/submissions${query}`, {
      headers: getAuthHeaders(),
    });
  },

  async updateSubmission(
    id: string,
    payload: UpdateDynamicSubmissionPayload,
  ): Promise<
    ApiSuccessResponse<{
      submission: DynamicSubmissionItem;
      customerWhatsAppUrl?: string | null;
    }>
  > {
    return request(`/submissions/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  },

  async cancelMySubmission(
    id: string,
    cancellationReason?: string,
  ): Promise<ApiSuccessResponse<{ submission: DynamicSubmissionItem }>> {
    return request(`/submissions/${id}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        cancellationReason,
      }),
    });
  },

  async deleteSubmission(id: string): Promise<ApiSuccessResponse<null>> {
    return request(`/submissions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },
};