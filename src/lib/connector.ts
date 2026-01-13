import type { Story, CreateStoryInput, ListStoriesOptions, UpdateStoryInput, Project, Board, Dimension } from './types.js';

/**
 * Abstract interface for data operations.
 * Implementations can use the Klaro API or local filesystem.
 */
export interface Connector {
  // Stories (cards)
  listStories(boardId: string, options?: ListStoriesOptions): Promise<Story[]>;
  getStories(boardId: string, identifiers: number[]): Promise<Story[]>;
  createStory(boardId: string, input: CreateStoryInput): Promise<Story>;
  updateStories(boardId: string, updates: UpdateStoryInput[]): Promise<Story[]>;
  deleteStories(boardId: string, identifiers: number[]): Promise<void>;

  // Projects
  listProjects(): Promise<Project[]>;

  // Boards
  listBoards(): Promise<Board[]>;
  getBoard(boardId: string): Promise<Board>;

  // Dimensions
  listDimensions(): Promise<Dimension[]>;
}
