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
  dimensions?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
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
  dimensions?: Record<string, string>;
}

export interface ListStoriesOptions {
  limit?: number;
}
