export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly photoUrl: string;
  readonly address: UserAddress;
  readonly preferredLanguage: string;
}

export interface UserAddress {
  readonly street: string;
  readonly number: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly latitude: number;
  readonly longitude: number;
}
