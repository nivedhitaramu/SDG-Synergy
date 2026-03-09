import { Leaf, Droplet, Sun, Users, GraduationCap, HeartPulse, Building, Globe, Zap, Scale, Briefcase, Factory, Shield, Recycle, TreePine, Fish, Link } from "lucide-react";

export const SDG_DATA = [
  { id: 1, name: "No Poverty", color: "#E5243B", icon: Users },
  { id: 2, name: "Zero Hunger", color: "#DDA63A", icon: HeartPulse },
  { id: 3, name: "Good Health & Well-being", color: "#4C9F38", icon: HeartPulse },
  { id: 4, name: "Quality Education", color: "#C5192D", icon: GraduationCap },
  { id: 5, name: "Gender Equality", color: "#FF3A21", icon: Scale },
  { id: 6, name: "Clean Water & Sanitation", color: "#26BDE2", icon: Droplet },
  { id: 7, name: "Affordable & Clean Energy", color: "#FCC30B", icon: Zap },
  { id: 8, name: "Decent Work & Economic Growth", color: "#A21942", icon: Briefcase },
  { id: 9, name: "Industry, Innovation & Infrastructure", color: "#FD6925", icon: Factory },
  { id: 10, name: "Reduced Inequalities", color: "#DD1367", icon: Scale },
  { id: 11, name: "Sustainable Cities & Communities", color: "#FD9D24", icon: Building },
  { id: 12, name: "Responsible Consumption & Production", color: "#BF8B2E", icon: Recycle },
  { id: 13, name: "Climate Action", color: "#3F7E44", icon: Sun },
  { id: 14, name: "Life Below Water", color: "#0A97D9", icon: Fish },
  { id: 15, name: "Life on Land", color: "#56C02B", icon: TreePine },
  { id: 16, name: "Peace, Justice & Strong Institutions", color: "#00689D", icon: Shield },
  { id: 17, name: "Partnerships for the Goals", color: "#19486A", icon: Link },
];

export function getSDG(id: number) {
  return SDG_DATA.find((sdg) => sdg.id === id) || SDG_DATA[0];
}
