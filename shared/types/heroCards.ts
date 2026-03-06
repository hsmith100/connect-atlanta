export interface HeroCard {
  id: string;
  entity: string;
  title: string;
  description: string;
  ctaText: string;
  linkUrl: string;
  imageUrl: string | null;
  icon: string | null;
  sortOrder: number;
  visible: boolean;
}
