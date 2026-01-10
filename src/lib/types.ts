export interface Config {
  token?: string;
  project?: string;
  email?: string;
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
}
