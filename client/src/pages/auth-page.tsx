import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Leaf, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { SDG_GOALS } from "@/lib/sdgs";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const INDIA_CITIES = [
  "Ahmedabad", "Bangalore", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore",
  "Delhi", "Faridabad", "Ghaziabad", "Gurgaon", "Guwahati", "Hyderabad", "Indore", "Jaipur",
  "Kanpur", "Kochi", "Kolkata", "Kozhikode", "Ludhiana", "Lucknow", "Madurai", "Mangalore",
  "Mumbai", "Nagpur", "Noida", "Panaji", "Pune", "Raipur", "Ranchi", "Surat", "Thane",
  "Thiruvananthapuram", "Vadodara", "Visakhapatnam", "Vizag"
];

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(5, "Address is required"),
  orgType: z.string(),
  location: z.string().min(2, "Location is required"),
  sdgs: z.array(z.number()).length(3, "Select exactly 3 SDG goals"),
  expertise: z.string().min(5, "Expertise/Resources required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, loginMutation, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState<"form" | "otp">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
      address: "",
      orgType: "Individual",
      location: "",
      sdgs: [],
      expertise: "",
    },
  });

  const [otpForm, setOtpForm] = useState("");

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || user) return null;

  const onLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const handleSDGToggle = (id: number) => {
    const updated = selectedSDGs.includes(id)
      ? selectedSDGs.filter(x => x !== id)
      : [...selectedSDGs, id];
    setSelectedSDGs(updated);
    registerForm.setValue("sdgs", updated);
  };

  const handleCityChange = (value: string) => {
    setCityInput(value);
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
    registerForm.setValue("location", city);
    setCityInput(city);
    setFilteredCities([]);
  };

  const onRegister = async (data: RegisterFormValues) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      setRegisteredEmail(data.email);
      setRegisterStep("otp");
    } catch (err: any) {
      console.error("Registration error:", err);
      registerForm.setError("email", { message: err.message || "Registration failed" });
    }
  };

  const verifyOTP = async () => {
    if (!otpForm || otpForm.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }
    try {
      setOtpLoading(true);
      setOtpError("");
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        email: registeredEmail,
        otp: otpForm,
      });
      // Reset forms and redirect to login
      setRegisterStep("form");
      setOtpForm("");
      setSelectedSDGs([]);
      registerForm.reset();
      setActiveTab("login");
      loginForm.setValue("email", registeredEmail);
    } catch (err: any) {
      setOtpError(err.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80"
          alt="Mountains"
          className="w-full h-full object-cover opacity-20 dark:opacity-10 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      <div className="z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl mb-4">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">SDG Synergy</h1>
          <p className="text-muted-foreground mt-2">Connect to achieve the Global Goals</p>
        </div>

        <Card className="shadow-2xl border-border/50">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...loginForm.register("email")} />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" {...loginForm.register("password")} />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                {registerStep === "form" ? (
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name / Organization Name</Label>
                      <Input id="reg-name" {...registerForm.register("name")} />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" {...registerForm.register("email")} />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input id="reg-password" type="password" {...registerForm.register("password")} />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" {...registerForm.register("phone")} placeholder="+91-XXXXXXXXXX" />
                        {registerForm.formState.errors.phone && (
                          <p className="text-sm text-destructive">{registerForm.formState.errors.phone.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgType">Organization Type</Label>
                        <Select
                          onValueChange={(val) => registerForm.setValue("orgType", val)}
                          defaultValue={registerForm.getValues("orgType")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" {...registerForm.register("address")} placeholder="Street address" />
                      {registerForm.formState.errors.address && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.address.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location (India)</Label>
                      <div className="relative">
                        <Input
                          id="location"
                          value={cityInput}
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
                      {registerForm.formState.errors.location && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.location.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Select 3 Primary SDG Goals</Label>
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
                      {registerForm.formState.errors.sdgs && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.sdgs.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{selectedSDGs.length}/3 selected</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expertise">Expertise / Resources</Label>
                      <Input id="expertise" {...registerForm.register("expertise")} placeholder="E.g. Funding, Tech, Local network..." />
                      {registerForm.formState.errors.expertise && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.expertise.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                      {registerForm.formState.isSubmitting ? "Creating Account..." : "Create Account & Verify Email"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        We've sent a 6-digit OTP to {registeredEmail}. Check your email and enter it below.
                      </AlertDescription>
                    </Alert>
                    {otpError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{otpError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="otp">6-Digit OTP</Label>
                      <Input
                        id="otp"
                        maxLength={6}
                        value={otpForm}
                        onChange={(e) => setOtpForm(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="000000"
                      />
                    </div>
                    <Button
                      onClick={verifyOTP}
                      className="w-full"
                      disabled={otpLoading || otpForm.length !== 6}
                    >
                      {otpLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setRegisterStep("form");
                        setOtpForm("");
                      }}
                    >
                      Back to Registration
                    </Button>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
