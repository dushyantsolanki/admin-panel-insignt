export type CategoryStatus = "active" | "archived";

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  totalPost: number;
  status: CategoryStatus;
  color: string;
  showOnHome: boolean;
  createdAt: Date
}


