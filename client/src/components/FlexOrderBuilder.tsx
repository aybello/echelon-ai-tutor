import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface FlexItem {
  courseKey: string;
  termMonths: 3 | 6;
  quantity: number;
}

const ONTARIO_COURSES = [
  { key: "oit", label: "OIT (Operator-in-Training)", band: "oit" },
  { key: "class1-water", label: "Class 1 Water Treatment", band: "class1" },
  { key: "class1-wastewater", label: "Class 1 Wastewater Treatment", band: "class1" },
  { key: "class1-water-dist", label: "Class 1 Water Distribution", band: "class1" },
  { key: "class1-wastewater-coll", label: "Class 1 Wastewater Collection", band: "class1" },
  { key: "class2-water", label: "Class 2 Water Treatment", band: "class2" },
  { key: "class2-wastewater", label: "Class 2 Wastewater Treatment", band: "class2" },
  { key: "class2-water-dist", label: "Class 2 Water Distribution", band: "class2" },
  { key: "class2-wastewater-coll", label: "Class 2 Wastewater Collection", band: "class2" },
  { key: "class3-water", label: "Class 3 Water Treatment", band: "class3" },
  { key: "class3-wastewater", label: "Class 3 Wastewater Treatment", band: "class3" },
  { key: "class3-water-dist", label: "Class 3 Water Distribution", band: "class3" },
  { key: "class3-wastewater-coll", label: "Class 3 Wastewater Collection", band: "class3" },
  { key: "class4-water", label: "Class 4 Water Treatment", band: "class4" },
  { key: "class4-wastewater", label: "Class 4 Wastewater Treatment", band: "class4" },
  { key: "class4-water-dist", label: "Class 4 Water Distribution", band: "class4" },
  { key: "class4-wastewater-coll", label: "Class 4 Wastewater Collection", band: "class4" },
];

const WESTERN_COURSES = [
  { key: "wpi-class1-water", label: "WPI Class 1 Water", band: "class1" },
  { key: "wpi-class1-wastewater", label: "WPI Class 1 Wastewater", band: "class1" },
  { key: "wpi-class1-water-dist", label: "WPI Class 1 Distribution", band: "class1" },
  { key: "wpi-class1-wastewater-coll", label: "WPI Class 1 Collection", band: "class1" },
  { key: "wpi-class2-water", label: "WPI Class 2 Water", band: "class2" },
  { key: "wpi-class2-wastewater", label: "WPI Class 2 Wastewater", band: "class2" },
  { key: "wpi-class2-water-dist", label: "WPI Class 2 Distribution", band: "class2" },
  { key: "wpi-class2-wastewater-coll", label: "WPI Class 2 Collection", band: "class2" },
  { key: "wpi-class3-water", label: "WPI Class 3 Water", band: "class3" },
  { key: "wpi-class3-wastewater", label: "WPI Class 3 Wastewater", band: "class3" },
  { key: "wpi-class3-water-dist", label: "WPI Class 3 Distribution", band: "class3" },
  { key: "wpi-class3-wastewater-coll", label: "WPI Class 3 Collection", band: "class3" },
  { key: "wpi-class4-water", label: "WPI Class 4 Water", band: "class4" },
  { key: "wpi-class4-wastewater", label: "WPI Class 4 Wastewater", band: "class4" },
  { key: "wpi-class4-water-dist", label: "WPI Class 4 Distribution", band: "class4" },
  { key: "wpi-class4-wastewater-coll", label: "WPI Class 4 Collection", band: "class4" },
];

// Client-side pricing lookup (mirrors server TEAM_PRICES_CAD)
const PRICES: Record<string, Record<string, { three: number; six: number }>> = {
  ontario: {
    oit: { three: 3900, six: 4900 },
    class1: { three: 7900, six: 9900 },
    class2: { three: 11900, six: 14900 },
    class3: { three: 19900, six: 24900 },
    class4: { three: 29900, six: 34900 },
  },
  western: {
    class1: { three: 11900, six: 14900 },
    class2: { three: 14900, six: 19900 },
    class3: { three: 19900, six: 24900 },
    class4: { three: 29900, six: 34900 },
  },
};

function getItemPrice(province: string, band: string, termMonths: number): number {
  const p = PRICES[province]?.[band];
  if (!p) return 0;
  return termMonths === 3 ? p.three : p.six;
}

function getDiscount(totalLicences: number): number {
  if (totalLicences >= 50) return 0.20;
  if (totalLicences >= 25) return 0.15;
  if (totalLicences >= 10) return 0.10;
  return 0;
}

function formatCAD(cents: number): string {
  return `CA$${(cents / 100).toFixed(2)}`;
}

export function FlexOrderBuilder() {
  const [province, setProvince] = useState<"ontario" | "western">("ontario");
  const [billingEmail, setBillingEmail] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [sameEmail, setSameEmail] = useState(true);
  const [items, setItems] = useState<FlexItem[]>([{ courseKey: "", termMonths: 3, quantity: 1 }]);

  const courses = province === "ontario" ? ONTARIO_COURSES : WESTERN_COURSES;
  const totalLicences = items.reduce((sum, item) => sum + item.quantity, 0);
  const discount = getDiscount(totalLicences);

  // Calculate line totals
  const lineItems = items.map(item => {
    const course = courses.find(c => c.key === item.courseKey);
    const unitPrice = course ? getItemPrice(province, course.band, item.termMonths) : 0;
    return { ...item, unitPrice, lineTotal: unitPrice * item.quantity, label: course?.label ?? "" };
  });
  const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const discountAmount = Math.round(subtotal * discount);
  const total = subtotal - discountAmount;

  const createOrder = trpc.teamFlex.createOrder.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => toast.error(err.message),
  });

  const addItem = () => setItems([...items, { courseKey: "", termMonths: 3, quantity: 1 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof FlexItem, value: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = () => {
    if (!billingEmail.trim() || !billingEmail.includes("@")) {
      toast.error("Please enter a valid billing email");
      return;
    }
    const mgr = sameEmail ? billingEmail : managerEmail;
    if (!mgr.trim() || !mgr.includes("@")) {
      toast.error("Please enter a valid manager email");
      return;
    }
    const validItems = items.filter(i => i.courseKey && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one course");
      return;
    }
    createOrder.mutate({
      managerEmail: mgr.trim().toLowerCase(),
      billingEmail: billingEmail.trim().toLowerCase(),
      province,
      items: validItems,
      overlapAcknowledged: false,
    });
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Build Your Course Pass Order</CardTitle>
        <p className="text-sm text-gray-500">Pick the courses your operators need, choose 3 or 6 month access, and check out in one order.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Province */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 font-medium">Province</Label>
          <Select value={province} onValueChange={(v) => setProvince(v as "ontario" | "western")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ontario">Ontario (MOECP)</SelectItem>
              <SelectItem value="western">Western Canada (WPI)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Billing Email */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 font-medium">Billing email</Label>
          <Input
            type="email"
            placeholder="billing@yourorg.com"
            value={billingEmail}
            onChange={e => setBillingEmail(e.target.value)}
          />
          <p className="text-xs text-gray-400">Payment receipt will be sent here.</p>
        </div>

        {/* Manager Email */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={sameEmail}
              onChange={e => setSameEmail(e.target.checked)}
              className="rounded border-gray-300"
            />
            Manager email is the same as billing email
          </label>
          {!sameEmail && (
            <div className="mt-2">
              <Label className="text-gray-700 font-medium">Manager email</Label>
              <Input
                type="email"
                placeholder="manager@yourorg.com"
                value={managerEmail}
                onChange={e => setManagerEmail(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">This person will manage operator licences and see the dashboard.</p>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-medium">Licences</Label>
          {items.map((item, idx) => {
            const course = courses.find(c => c.key === item.courseKey);
            const unitPrice = course ? getItemPrice(province, course.band, item.termMonths) : 0;
            return (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={item.courseKey} onValueChange={(v) => updateItem(idx, "courseKey", v)}>
                    <SelectTrigger className="flex-1 min-w-[180px]"><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(item.termMonths)} onValueChange={(v) => updateItem(idx, "termMonths", parseInt(v))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    className="w-16 text-center"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  {items.length > 1 && (
                    <Button variant="ghost" size="sm" className="text-red-500 h-8 px-2" onClick={() => removeItem(idx)}>✕</Button>
                  )}
                </div>
                {item.courseKey && (
                  <div className="flex justify-between text-xs text-gray-500 px-1">
                    <span>{formatCAD(unitPrice)} × {item.quantity}</span>
                    <span className="font-medium text-gray-700">{formatCAD(unitPrice * item.quantity)}</span>
                  </div>
                )}
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={addItem} className="text-xs">+ Add another course</Button>
        </div>

        {/* Pricing Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({totalLicences} licence{totalLicences !== 1 ? "s" : ""})</span>
            <span className="font-medium">{formatCAD(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-700">
              <span>Volume discount ({Math.round(discount * 100)}% off)</span>
              <span className="font-medium">−{formatCAD(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t pt-2">
            <span>Total</span>
            <span>{formatCAD(total)}</span>
          </div>
          {discount > 0 && (
            <p className="text-xs text-green-600 text-right">You save {formatCAD(discountAmount)} with volume pricing!</p>
          )}
        </div>

        {/* CTA */}
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-3"
          onClick={handleSubmit}
          disabled={createOrder.isPending || total === 0}
        >
          {createOrder.isPending ? "Creating order..." : `Proceed to Checkout — ${formatCAD(total)}`}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Licences are activated by operators when they start studying. Unused licences can be reassigned.
        </p>
      </CardContent>
    </Card>
  );
}
