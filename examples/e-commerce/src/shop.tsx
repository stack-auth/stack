export type Shop = {
  displayName: string,
  products: Product[],
};

export type Product = {
  id: string,
  dollarPrice: number,
  name: string,
};
