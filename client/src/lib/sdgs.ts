import { Leaf, Droplet, Sun, Users, GraduationCap, HeartPulse, Building, Globe, Zap, Scale, Briefcase, Factory, Shield, Recycle, TreePine, Fish, Link } from "lucide-react";

export const SDG_DATA = [
  { id: 1, title: "No Poverty", name: "No Poverty", color: "#E5243B", icon: Users },
  { id: 2, title: "Zero Hunger", name: "Zero Hunger", color: "#DDA63A", icon: HeartPulse },
  { id: 3, title: "Good Health & Well-being", name: "Good Health & Well-being", color: "#4C9F38", icon: HeartPulse },
  { id: 4, title: "Quality Education", name: "Quality Education", color: "#C5192D", icon: GraduationCap },
  { id: 5, title: "Gender Equality", name: "Gender Equality", color: "#FF3A21", icon: Scale },
  { id: 6, title: "Clean Water & Sanitation", name: "Clean Water & Sanitation", color: "#26BDE2", icon: Droplet },
  { id: 7, title: "Affordable & Clean Energy", name: "Affordable & Clean Energy", color: "#FCC30B", icon: Zap },
  { id: 8, title: "Decent Work & Economic Growth", name: "Decent Work & Economic Growth", color: "#A21942", icon: Briefcase },
  { id: 9, title: "Industry, Innovation & Infrastructure", name: "Industry, Innovation & Infrastructure", color: "#FD6925", icon: Factory },
  { id: 10, title: "Reduced Inequalities", name: "Reduced Inequalities", color: "#DD1367", icon: Scale },
  { id: 11, title: "Sustainable Cities & Communities", name: "Sustainable Cities & Communities", color: "#FD9D24", icon: Building },
  { id: 12, title: "Responsible Consumption & Production", name: "Responsible Consumption & Production", color: "#BF8B2E", icon: Recycle },
  { id: 13, title: "Climate Action", name: "Climate Action", color: "#3F7E44", icon: Sun },
  { id: 14, title: "Life Below Water", name: "Life Below Water", color: "#0A97D9", icon: Fish },
  { id: 15, title: "Life on Land", name: "Life on Land", color: "#56C02B", icon: TreePine },
  { id: 16, title: "Peace, Justice & Strong Institutions", name: "Peace, Justice & Strong Institutions", color: "#00689D", icon: Shield },
  { id: 17, title: "Partnerships for the Goals", name: "Partnerships for the Goals", color: "#19486A", icon: Link },
];

// Alias for compatibility with frontend imports
export const SDG_GOALS = SDG_DATA;

export function getSDG(id: number) {
  return SDG_DATA.find((sdg) => sdg.id === id) || SDG_DATA[0];
}
