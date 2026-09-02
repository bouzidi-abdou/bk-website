import {
  Zap, Crown, Rocket, Users, CreditCard, Gamepad2, Gift,
  Smartphone, Tv, Play, Bot, Music, Clapperboard, Scissors, History,
  KeyRound, Send, Ticket, Coins, Globe, Layers, PenTool, Image as ImageIcon,
  Palette, Code2, Package, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Zap, Crown, Rocket, Users, CreditCard, Gamepad2, Gift,
  Smartphone, Tv, Play, Bot, Music, Clapperboard, Scissors, History,
  KeyRound, Send, Ticket, Coins, Globe, Layers, PenTool, Image: ImageIcon,
  Palette, Code2, Package,
};

export default function ProductIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={className} />;
}
