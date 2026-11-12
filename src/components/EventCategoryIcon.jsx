import {
  Baby, Drama, Dumbbell, Flower2, Frame, HandHeart, Landmark, Laptop, Music, Palette, PartyPopper, Sparkles, Tag, Utensils,
} from 'lucide-react';

const ICONS = {
  SPIRITUAL: Flower2,
  HERITAGE_WALK: Landmark,
  MUSIC: Music,
  SPORTS: Dumbbell,
  FOOD: Utensils,
  TECH: Laptop,
  COMEDY_THEATRE: Drama,
  EXHIBITION: Frame,
  WORKSHOP: Palette,
  FESTIVAL: PartyPopper,
  KIDS: Baby,
  SEVA: HandHeart,
  CULTURAL: Sparkles,
};

/** Small icon for a public event category (decorative: the label is always shown next to it). */
export default function EventCategoryIcon({ category, size = 16, className = '' }) {
  const Icon = ICONS[category] || Tag;
  return <Icon size={size} className={`shrink-0 ${className}`} aria-hidden />;
}
