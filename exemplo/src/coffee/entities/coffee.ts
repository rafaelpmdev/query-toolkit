
export interface Coffee {
  id: number;
  name: string;
  origin: string;
  roast: string;
  flavor: string;
  price: number;
  available: boolean;
  tags: string[];
  createdAt: Date;
}
