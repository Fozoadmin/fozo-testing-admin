export interface SurpriseBag {
  bagId: string;
  bagName: string;
  denominationValue: number;
  actualWorth: number;
  description: string | null;
  imageUrl: string | null;
  quantityAvailable: number;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  availableDate: string | null;
  isActive: boolean;
  isVegetarian: boolean;
  pickupTime?: string;
}

export interface GroupedRestaurant {
  restaurantId: string;
  id?: string;
  restaurantName: string;
  restaurantOwnerPhone: string | null;
  userEmail?: string | null;
  phoneNumber?: string | null;
  totalBags: number;
  bags: SurpriseBag[];
}
