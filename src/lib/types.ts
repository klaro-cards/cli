export interface ProjectDefaults {
  board?: string;
  dims?: string;
}

export interface Secrets {
  token?: string;
}

export interface Config {
  token?: string;
  project?: string;
  email?: string;
  api_url?: string;
  projectDefaults?: Record<string, ProjectDefaults>;
}

export interface AuthToken {
  token_type: string;
  access_token: string;
  expires_in: number;
}

export interface Story {
  id: number;
  identifier: string;
  title: string;
  specification?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface Board {
  id: number;
  identifier: string;
  label: string;
  location?: string;
  objective?: string;
  filters?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface Project {
  id: number;
  subdomain: string;
  label: string;
  [key: string]: unknown;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export interface CreateStoryInput {
  title: string;
  specification?: string;
  [key: string]: string | undefined;
}

export interface ListStoriesOptions {
  limit?: number;
  filters?: Record<string, string>;
}

export interface UpdateStoryInput {
  identifier: number;
  [key: string]: string | number | string[] | number[] | undefined;
}

export interface CreateAttachmentInput {
  story: string;
  filename: string;
  url: string;
  description?: string;
  isCover: boolean;
  sizeInBytes: number;
}

export interface StoryAttachment {
  id: string;
  filename: string;
  url: string;
  description?: string;
  isCover: boolean;
  sizeInBytes: number;
  createdAt?: string;
  createdBy?: string;
  [key: string]: unknown;
}

export interface SeshatUploadResult {
  name: string;
  originalname?: string;
}

export interface Dimension {
  code: string;
  label?: string;
  datatype: string;
  values?: Array<{ id: number | null; label?: string }>;
  [key: string]: unknown;
}
