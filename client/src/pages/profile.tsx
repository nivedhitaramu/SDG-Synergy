import { useState } from "react";
import { AppLayout } from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SDGBadge } from "@/components/shared/sdg-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, MapPin, Mail, Calendar, Edit2, Trophy } from "lucide-react";
import { BadgesSection } from "@/components/shared/badges-section";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { SDG_GOALS } from "@/lib/sdgs";
import { useQueryClient } from "@tanstack/react-query";

const INDIA_CITIES = [
  "Ahmedabad", "Bangalore", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore",
  "Delhi", "Faridabad", "Ghaziabad", "Gurgaon", "Guwahati", "Hyderabad", "Indore", "Jaipur",
  "Kanpur", "Kochi", "Kolkata", "Kozhikode", "Ludhiana", "Lucknow", "Madurai", "Mangalore",
  "Mumbai", "Nagpur", "Noida", "Panaji", "Pune", "Raipur", "Ranchi", "Surat", "Thane",
  "Thiruvananthapuram", "Vadodara", "Visakhapatnam", "Vizag"
];

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>(user?.sdgs || []);

  const [formData, setFormData] = useState({
    email: user?.email || "",
    location: user?.location || "",
    orgType: user?.orgType || "",
    sdgs: user?.sdgs || [],
  });

  if (!user) return null;

  const handleCityChange = (value: string) => {
    setFormData({ ...formData, location: value });
    if (value.length > 0) {
      const filtered = INDIA_CITIES.filter(city =>
        city.toLowerCase().startsWith(value.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  };

  const selectCity = (city: string) => {
    setFormData({ ...formData, location: city });
    setFilteredCities([]);
  };

  const handleSDGToggle = (id: number) => {
    const updated = selectedSDGs.includes(id)
      ? selectedSDGs.filter(x => x !== id)
      : [...selectedSDGs, id];
    setSelectedSDGs(updated);
    setFormData({ ...formData, sdgs: updated });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiRequest("PATCH", "/api/profile/update", formData);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header Card */}
        <Card className="overflow-hidden border-border/50 shadow-xl shadow-black/5">
          <div className="h-32 bg-gradient-to-r from-primary to-secondary/80"></div>
          <CardContent className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
              <div className="flex flex-col md:flex-row gap-6 items-start flex-1">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl -mt-16 bg-muted">
                  <AvatarFallback className="text-4xl font-display font-bold text-primary">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-2 md:-mt-4 flex-1">
                  <h1 className="text-3xl font-display font-bold">{user.name}</h1>
                  <div className="flex flex-col gap-2 text-muted-foreground mt-2 font-medium">
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {user.orgType}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {user.location}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Recently'}</span>
                  </div>
                </div>
              </div>
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <Card className="border-border/50 shadow-md bg-muted/30">
            <CardHeader>
              <CardTitle className="font-display">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization Type</Label>
                  <Select value={formData.orgType} onValueChange={(val) => setFormData({ ...formData, orgType: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location (India)</Label>
                <div className="relative">
                  <Input
                    value={formData.location}
                    onChange={(e) => handleCityChange(e.target.value)}
                    placeholder="Type city name..."
                  />
                  {filteredCities.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 max-h-40 overflow-y-auto z-10">
                      {filteredCities.map(city => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => selectCity(city)}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>3 Primary SDG Goals</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
                  {SDG_GOALS.map(goal => (
                    <label key={goal.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                      <Checkbox
                        checked={selectedSDGs.includes(goal.id)}
                        onCheckedChange={() => handleSDGToggle(goal.id)}
                      />
                      <span className="text-sm">{goal.id}. {goal.title}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{selectedSDGs.length}/3 selected</p>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-2 border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="font-display">Expertise & Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">Sustainable Development Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {user.sdgs.map(id => (
                    <SDGBadge key={id} id={id} showLabel className="text-sm px-3 py-1" />
                  ))}
                  {user.sdgs.length === 0 && <span className="text-muted-foreground text-sm italic">No SDGs selected.</span>}
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <h3 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">Offered Resources / Expertise</h3>
                <p className="text-foreground leading-relaxed">
                  {user.expertise || "No expertise detailed yet."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="font-display text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Phone</p>
                <p className="text-sm font-medium">{user.phone}</p>
              </div>
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Address</p>
                <p className="text-sm font-medium">{user.address}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Badges Section */}
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements & Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BadgesSection userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
