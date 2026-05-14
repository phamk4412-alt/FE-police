export interface NewsArticle {
  id?: string | number;
  Id?: string | number;
  title?: string;
  Title?: string;
  summary?: string;
  Summary?: string;
  description?: string;
  Description?: string;
  content?: string;
  Content?: string;
  thumbnailUrl?: string;
  ThumbnailUrl?: string;
  imageUrl?: string;
  ImageUrl?: string;
  images?: string[];
  Images?: string[];
  category?: string;
  Category?: string;
  status?: string;
  Status?: string;
  isFeatured?: boolean;
  IsFeatured?: boolean;
  featuredOrder?: number | null;
  FeaturedOrder?: number | null;
  publishedAt?: string;
  PublishedAt?: string;
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
  UpdatedAt?: string;
}

export interface NationalEvent {
  id?: string | number;
  Id?: string | number;
  name?: string;
  Name?: string;
  eventDate?: string;
  EventDate?: string;
  daysRemaining?: number;
  DaysRemaining?: number;
  sortOrder?: number;
  SortOrder?: number;
}

export interface NewsPayload {
  title: string;
  summary: string;
  content: string;
  thumbnailUrl: string;
  category: string;
  isFeatured: boolean;
  featuredOrder: number | null;
}
