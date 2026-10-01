import { useEffect, useState } from "react";
import { UserCircle, Save } from "lucide-react";
import { profileApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Reveal } from "../components/animation/Reveal";
import { Counter } from "../components/animation/Counter";
import { Card, Button, Input, Select, Skeleton } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { PageLayout } from "../components/layout/PageLayout";

const DISTRICTS = [
  "Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Kanchipuram",
  "Kanyakumari", "Karur", "Madurai", "Nagapattinam", "Namakkal", "Salem",
  "Thanjavur", "Theni", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
  "Tiruvallur", "Vellore", "Villupuram", "Virudhunagar",
];

export default function Profile() {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    profileApi
      .mine()
      .then((r) => setP(r.profile))
      .catch(() => toast.error("Could not load your profile"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k) => (e) => {
    const v = e.target.value;
    setP((prev) => ({ ...prev, [k]: v === "" ? null : v }));
  };

  const setAddr = (k) => (e) =>
    setP((prev) => ({ ...prev, address: { ...prev.address, [k]: e.target.value } }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: p.fullName,
        email: p.email || null,
        photo: p.photo || null,
        dateOfBirth: p.dateOfBirth || null,
        gender: p.gender || null,
        occupation: p.occupation || null,
        annualIncome: p.annualIncome != null && p.annualIncome !== "" ? Number(p.annualIncome) : null,
        category: p.category || null,
        isRuralResident: !!p.isRuralResident,
        landHoldingAcres: p.landHoldingAcres != null && p.landHoldingAcres !== "" ? Number(p.landHoldingAcres) : null,
        preferredLanguage: p.preferredLanguage || "en",
        address: {
          line1: p.address?.line1 || "",
          district: p.address?.district || "",
          state: p.address?.state || "Tamil Nadu",
          pincode: p.address?.pincode || "",
        },
      };
      const res = await profileApi.update(payload);
      setP(res.profile);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setP((prev) => ({ ...prev, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 pt-28 sm:px-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <PageLayout>
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8">
      <Reveal>
        <div className="mb-8 flex items-start gap-4">
          <label className="group relative cursor-pointer overflow-hidden rounded-full p-0.5 transition-all">
            {p.photo ? (
              <img src={p.photo} alt="Profile" className="h-16 w-16 rounded-full object-cover ring-2 ring-navy-500/40" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-500/15 ring-2 ring-white/10">
                <UserCircle size={28} className="text-navy-300" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-[10px] font-bold uppercase tracking-wide text-white">Upload</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
          <div className="mt-1">
            <h1 className="font-display text-3xl font-bold text-white">My profile</h1>
            <p className="mt-1.5 text-slate-400">
              Entered once — used across every application and by the AI advisor
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="mb-6 p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Completeness</span>
            <span className="font-display text-lg font-bold text-white">
              <Counter to={p.completeness} suffix="%" duration={1000} />
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-navy-500 to-saffron-500 transition-all duration-700"
              style={{ width: `${p.completeness}%` }}
            />
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="space-y-6 p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Full name" value={p.fullName || ""} onChange={set("fullName")} />
            <Input label="Mobile" value={p.mobile || ""} disabled />
            <Input label="Email" type="email" value={p.email || ""} onChange={set("email")} />
            <Input
              label="Date of birth"
              type="date"
              value={p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : ""}
              onChange={set("dateOfBirth")}
            />
            <Select label="Gender" value={p.gender || ""} onChange={set("gender")}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
            <Select label="Category" value={p.category || ""} onChange={set("category")}>
              <option value="">Select</option>
              <option value="general">General</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
              <option value="ews">EWS</option>
            </Select>
          </div>

          <div className="border-t border-white/8 pt-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Address
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Address line" value={p.address?.line1 || ""} onChange={setAddr("line1")} />
              <Select label="District" value={p.address?.district || ""} onChange={setAddr("district")}>
                <option value="">Select district</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Input label="State" value={p.address?.state || ""} onChange={setAddr("state")} />
              <Input
                label="Pincode"
                inputMode="numeric"
                maxLength={6}
                value={p.address?.pincode || ""}
                onChange={setAddr("pincode")}
              />
            </div>
          </div>

          <div className="border-t border-white/8 pt-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Livelihood
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Occupation" value={p.occupation || ""} onChange={set("occupation")} />
              <Input
                label="Annual household income (Rs.)"
                type="number"
                value={p.annualIncome ?? ""}
                onChange={set("annualIncome")}
              />
              <Input
                label="Land holding (acres)"
                type="number"
                step="0.1"
                value={p.landHoldingAcres ?? ""}
                onChange={set("landHoldingAcres")}
              />
              <Select
                label="Rural resident"
                value={p.isRuralResident ? "yes" : "no"}
                onChange={(e) => setP((prev) => ({ ...prev, isRuralResident: e.target.value === "yes" }))}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </div>
          </div>

          <Button onClick={save} loading={saving} size="lg" className="w-full">
            <Save size={17} /> Save changes
          </Button>
        </Card>
      </Reveal>
    </div>
    </PageLayout>
  );
}
