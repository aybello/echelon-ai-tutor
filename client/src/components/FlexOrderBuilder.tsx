import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { calculateBlendedDiscount } from "@shared/pricingCatalogue";

interface FlexItem {
  courseKey: string;
  termMonths: 3 | 6;
  quantity: number;
}

interface CourseOption {
  key: string;
  label: string;
  band: "oit" | "class1" | "class2" | "class3" | "class4" | "wqa";
}

const ONTARIO_COURSES: CourseOption[] = [
  { key: "oit", label: "OIT Water", band: "oit" },
  { key: "oit-ww", label: "OIT Wastewater", band: "oit" },
  { key: "class1-water", label: "Class 1 Water Treatment", band: "class1" },
  { key: "class1-ww", label: "Class 1 Wastewater Treatment", band: "class1" },
  { key: "class1-water-dist", label: "Class 1 Water Distribution", band: "class1" },
  { key: "class1-wastewater-coll", label: "Class 1 Wastewater Collection", band: "class1" },
  { key: "class2-water", label: "Class 2 Water Treatment", band: "class2" },
  { key: "class2-ww", label: "Class 2 Wastewater Treatment", band: "class2" },
  { key: "class2-water-dist", label: "Class 2 Water Distribution", band: "class2" },
  { key: "class2-wastewater-coll", label: "Class 2 Wastewater Collection", band: "class2" },
  { key: "class3-water", label: "Class 3 Water Treatment", band: "class3" },
  { key: "class3-ww", label: "Class 3 Wastewater Treatment", band: "class3" },
  { key: "class3-water-dist", label: "Class 3 Water Distribution", band: "class3" },
  { key: "class3-wastewater-coll", label: "Class 3 Wastewater Collection", band: "class3" },
  { key: "class4-water", label: "Class 4 Water Treatment", band: "class4" },
  { key: "class4-ww", label: "Class 4 Wastewater Treatment", band: "class4" },
  { key: "class4-water-dist", label: "Class 4 Water Distribution", band: "class4" },
  { key: "class4-wastewater-coll", label: "Class 4 Wastewater Collection", band: "class4" },
  { key: "wqa", label: "Water Quality Analyst", band: "wqa" },
];

const WESTERN_COURSES: CourseOption[] = [
  { key: "wpi-class1-water", label: "WPI Class 1 Water Treatment", band: "class1" },
  { key: "wpi-class1-wastewater", label: "WPI Class 1 Wastewater Treatment", band: "class1" },
  { key: "wpi-class1-water-dist", label: "WPI Class 1 Water Distribution", band: "class1" },
  { key: "wpi-class1-water-coll", label: "WPI Class 1 Wastewater Collection", band: "class1" },
  { key: "wpi-class2-water", label: "WPI Class 2 Water Treatment", band: "class2" },
  { key: "wpi-class2-wastewater", label: "WPI Class 2 Wastewater Treatment", band: "class2" },
  { key: "wpi-class2-water-dist", label: "WPI Class 2 Water Distribution", band: "class2" },
  { key: "wpi-class2-water-coll", label: "WPI Class 2 Wastewater Collection", band: "class2" },
  { key: "wpi-class3-water", label: "WPI Class 3 Water Treatment", band: "class3" },
  { key: "wpi-class3-wastewater", label: "WPI Class 3 Wastewater Treatment", band: "class3" },
  { key: "wpi-class3-water-dist", label: "WPI Class 3 Water Distribution", band: "class3" },
  { key: "wpi-class3-water-coll", label: "WPI Class 3 Wastewater Collection", band: "class3" },
  { key: "wpi-class4-water", label: "WPI Class 4 Water Treatment", band: "class4" },
  { key: "wpi-class4-wastewater", label: "WPI Class 4 Wastewater Treatment", band: "class4" },
  { key: "wpi-class4-water-dist", label: "WPI Class 4 Water Distribution", band: "class4" },
  { key: "wpi-class4-water-coll", label: "WPI Class 4 Wastewater Collection", band: "class4" },
];

/** Mirrors server/teams/teamFlexPricing.ts. Server pricing remains authoritative at checkout. */
const PRICES: Record<string, Record<CourseOption["band"], { three: number; six: number }>> = {
  ontario: {
    oit: { three: 3900, six: 4900 },
    class1: { three: 5900, six: 7900 },
    class2: { three: 8900, six: 11900 },
    class3: { three: 14900, six: 19900 },
    class4: { three: 17900, six: 23900 },
    wqa: { three: 8900, six: 11900 },
  },
  western: {
    oit: { three: 0, six: 0 },
    class1: { three: 8900, six: 11900 },
    class2: { three: 11900, six: 15900 },
    class3: { three: 14900, six: 19900 },
    class4: { three: 17900, six: 23900 },
    wqa: { three: 0, six: 0 },
  },
};

function getItemPrice(province: "ontario" | "western", band: CourseOption["band"], termMonths: 3 | 6): number {
  const price = PRICES[province][band];
  return termMonths === 3 ? price.three : price.six;
}

function formatCAD(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function FlexOrderBuilder() {
  const [province, setProvince] = useState<"ontario" | "western">("ontario");
  const [organizationName, setOrganizationName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [sameEmail, setSameEmail] = useState(true);
  const [items, setItems] = useState<FlexItem[]>([{ courseKey: "", termMonths: 3, quantity: 1 }]);
  const availability = trpc.stripe.getCommercialAvailability.useQuery(undefined, { staleTime: 60_000 });

  const availableKeys = useMemo(
    () => new Set((availability.data?.products ?? []).map((product) => product.key)),
    [availability.data?.products],
  );
  const courses = (province === "ontario" ? ONTARIO_COURSES : WESTERN_COURSES)
    .filter((course) => availability.isLoading || availableKeys.has(course.key));
  const totalLicences = items.reduce((sum, item) => sum + item.quantity, 0);
  const discount = calculateBlendedDiscount(totalLicences);
  const lineItems = items.map((item) => {
    const course = courses.find((candidate) => candidate.key === item.courseKey);
    const unitPrice = course ? getItemPrice(province, course.band, item.termMonths) : 0;
    const discountedUnitPrice = Math.round(unitPrice * (1 - discount));
    return { ...item, unitPrice, discountedUnitPrice, lineTotal: discountedUnitPrice * item.quantity, label: course?.label ?? "" };
  });
  const subtotal = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = subtotal - total;

  const createOrder = trpc.teamFlex.createOrder.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (error) => toast.error(error.message),
  });

  const addItem = () => setItems((current) => [...current, { courseKey: "", termMonths: 3, quantity: 1 }]);
  const removeItem = (index: number) => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  const updateItem = <K extends keyof FlexItem>(index: number, field: K, value: FlexItem[K]) => {
    setItems((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = () => {
    if (!organizationName.trim()) return toast.error("Enter your organization name.");
    if (!billingEmail.trim() || !billingEmail.includes("@")) return toast.error("Enter a valid billing email.");
    const manager = sameEmail ? billingEmail : managerEmail;
    if (!manager.trim() || !manager.includes("@")) return toast.error("Enter a valid manager email.");
    const validItems = items.filter((item) => item.courseKey && item.quantity > 0);
    if (validItems.length === 0) return toast.error("Add at least one released course.");
    if (validItems.length !== items.length) return toast.error("Complete or remove every course row before checkout.");
    createOrder.mutate({
      organizationName: organizationName.trim(),
      managerEmail: manager.trim().toLowerCase(),
      billingEmail: billingEmail.trim().toLowerCase(),
      province,
      items: validItems,
      overlapAcknowledged: false,
    });
  };

  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Build a Teams Flex order</CardTitle>
        <p className="text-sm text-gray-500">Buy named, course-specific licences for 3 or 6 months. You can combine both terms in one order. Permanent Individual Exam Passes are available separately.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700">Organization name</Label>
          <Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="City or organization" maxLength={200} />
          <p className="text-xs text-gray-400">This name appears on the manager dashboard after payment.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700">Province or region</Label>
          <Select value={province} onValueChange={(value) => { setProvince(value as "ontario" | "western"); setItems([{ courseKey: "", termMonths: 3, quantity: 1 }]); }}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ontario">Ontario (MOECP / OWWCO)</SelectItem>
              <SelectItem value="western">Western Canada (WPI)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700">Billing email</Label>
          <Input type="email" value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} placeholder="billing@yourorg.com" />
          <p className="text-xs text-gray-400">Stripe sends the receipt and paid invoice to this address.</p>
        </div>

        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={sameEmail} onChange={(event) => setSameEmail(event.target.checked)} className="rounded border-gray-300" />
            Manager email is the same as billing email
          </label>
          {!sameEmail && <div className="mt-2"><Label className="font-medium text-gray-700">Manager email</Label><Input type="email" value={managerEmail} onChange={(event) => setManagerEmail(event.target.value)} placeholder="manager@yourorg.com" className="mt-1" /><p className="mt-1 text-xs text-gray-400">This person manages operator licences and the team dashboard.</p></div>}
        </div>

        <div className="space-y-3">
          <Label className="font-medium text-gray-700">Course licences</Label>
          {items.map((item, index) => {
            const course = courses.find((candidate) => candidate.key === item.courseKey);
            const unitPrice = course ? getItemPrice(province, course.band, item.termMonths) : 0;
            return <div key={index} className="space-y-2 rounded-lg bg-gray-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={item.courseKey} onValueChange={(value) => updateItem(index, "courseKey", value)}>
                  <SelectTrigger className="min-w-[200px] flex-1"><SelectValue placeholder={availability.isLoading ? "Checking courses…" : "Select a released course"} /></SelectTrigger>
                  <SelectContent>{courses.map((option) => <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={String(item.termMonths)} onValueChange={(value) => updateItem(index, "termMonths", Number(value) as 3 | 6)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="3">3 months</SelectItem><SelectItem value="6">6 months</SelectItem></SelectContent>
                </Select>
                <Input type="number" min={1} max={100} className="w-16 text-center" value={item.quantity} onChange={(event) => updateItem(index, "quantity", Math.max(1, Number.parseInt(event.target.value, 10) || 1))} />
                {items.length > 1 && <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500" onClick={() => removeItem(index)}>Remove</Button>}
              </div>
              {item.courseKey && <div className="flex justify-between px-1 text-xs text-gray-500"><span>{formatCAD(unitPrice)} × {item.quantity}</span><span className="font-medium text-gray-700">{formatCAD(unitPrice * item.quantity)}</span></div>}
            </div>;
          })}
          <Button variant="outline" size="sm" onClick={addItem} className="text-xs">Add another course or term</Button>
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal ({totalLicences} licence{totalLicences === 1 ? "" : "s"})</span><span className="font-medium">{formatCAD(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-green-700"><span>Graduated order discount ({(discount * 100).toFixed(1)}% effective)</span><span className="font-medium">−{formatCAD(discountAmount)}</span></div>}
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total before tax</span><span>{formatCAD(total)}</span></div>
          {discount > 0 && <p className="text-right text-xs text-green-600">You save {formatCAD(discountAmount)} through volume pricing.</p>}
        </div>

        <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-500 py-3 font-semibold text-white" onClick={handleSubmit} disabled={availability.isLoading || createOrder.isPending || total === 0}>
          {createOrder.isPending ? "Creating secure checkout…" : `Proceed to secure checkout — ${formatCAD(total)}`}
        </Button>
        <p className="text-center text-xs text-gray-400">Unused licences can be reassigned. Each operator starts their own study term when they activate the assigned Course Pass.</p>
      </CardContent>
    </Card>
  );
}
