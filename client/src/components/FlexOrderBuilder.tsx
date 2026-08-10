import { useState, useMemo } from "react";
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
  { key: "oit", label: "OIT (Operator-in-Training)" },
  { key: "class1-water", label: "Class 1 Water Treatment" },
  { key: "class1-wastewater", label: "Class 1 Wastewater Treatment" },
  { key: "class1-water-dist", label: "Class 1 Water Distribution" },
  { key: "class1-wastewater-coll", label: "Class 1 Wastewater Collection" },
  { key: "class2-water", label: "Class 2 Water Treatment" },
  { key: "class2-wastewater", label: "Class 2 Wastewater Treatment" },
  { key: "class2-water-dist", label: "Class 2 Water Distribution" },
  { key: "class2-wastewater-coll", label: "Class 2 Wastewater Collection" },
  { key: "class3-water", label: "Class 3 Water Treatment" },
  { key: "class3-wastewater", label: "Class 3 Wastewater Treatment" },
  { key: "class3-water-dist", label: "Class 3 Water Distribution" },
  { key: "class3-wastewater-coll", label: "Class 3 Wastewater Collection" },
  { key: "class4-water", label: "Class 4 Water Treatment" },
  { key: "class4-wastewater", label: "Class 4 Wastewater Treatment" },
  { key: "class4-water-dist", label: "Class 4 Water Distribution" },
  { key: "class4-wastewater-coll", label: "Class 4 Wastewater Collection" },
];

const WESTERN_COURSES = [
  { key: "wpi-class1-water", label: "WPI Class 1 Water" },
  { key: "wpi-class1-wastewater", label: "WPI Class 1 Wastewater" },
  { key: "wpi-class1-water-dist", label: "WPI Class 1 Distribution" },
  { key: "wpi-class1-wastewater-coll", label: "WPI Class 1 Collection" },
  { key: "wpi-class2-water", label: "WPI Class 2 Water" },
  { key: "wpi-class2-wastewater", label: "WPI Class 2 Wastewater" },
  { key: "wpi-class2-water-dist", label: "WPI Class 2 Distribution" },
  { key: "wpi-class2-wastewater-coll", label: "WPI Class 2 Collection" },
  { key: "wpi-class3-water", label: "WPI Class 3 Water" },
  { key: "wpi-class3-wastewater", label: "WPI Class 3 Wastewater" },
  { key: "wpi-class3-water-dist", label: "WPI Class 3 Distribution" },
  { key: "wpi-class3-wastewater-coll", label: "WPI Class 3 Collection" },
  { key: "wpi-class4-water", label: "WPI Class 4 Water" },
  { key: "wpi-class4-wastewater", label: "WPI Class 4 Wastewater" },
  { key: "wpi-class4-water-dist", label: "WPI Class 4 Distribution" },
  { key: "wpi-class4-wastewater-coll", label: "WPI Class 4 Collection" },
];

export function FlexOrderBuilder() {
  const [province, setProvince] = useState<"ontario" | "western">("ontario");
  const [orgName, setOrgName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [items, setItems] = useState<FlexItem[]>([{ courseKey: "", termMonths: 3, quantity: 1 }]);

  const courses = province === "ontario" ? ONTARIO_COURSES : WESTERN_COURSES;
  const totalLicences = items.reduce((sum, item) => sum + item.quantity, 0);

  const createOrder = trpc.teamFlex.createOrder.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const addItem = () => {
    setItems([...items, { courseKey: "", termMonths: 3, quantity: 1 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof FlexItem, value: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = () => {
    if (!orgName.trim()) {
      toast.error("Please enter your organization name");
      return;
    }
    if (!managerEmail.trim() || !managerEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    const validItems = items.filter(i => i.courseKey && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one course");
      return;
    }
    createOrder.mutate({
      orgName: orgName.trim(),
      province,
      managerEmail: managerEmail.trim(),
      items: validItems,
      overlapAcknowledged: false,
      origin: window.location.origin,
    });
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Build Your Flex Order</CardTitle>
        <p className="text-sm text-gray-500">Course-specific licences — 3 or 6 month terms. Mix and match courses and terms in one order.</p>
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

        {/* Org Name */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 font-medium">Organization Name</Label>
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. City of Toronto Water Services"
          />
        </div>

        {/* Manager Email */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 font-medium">Your Email</Label>
          <Input
            type="email"
            value={managerEmail}
            onChange={(e) => setManagerEmail(e.target.value)}
            placeholder="manager@yourorg.ca"
          />
          <p className="text-xs text-gray-400">We'll send the receipt and licence management link to this address.</p>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-medium">Licences</Label>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Select value={item.courseKey} onValueChange={(v) => updateItem(idx, "courseKey", v)}>
                <SelectTrigger className="flex-1 min-w-[180px]"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(item.termMonths)} onValueChange={(v) => updateItem(idx, "termMonths", parseInt(v))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
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
                <Button variant="ghost" size="sm" className="text-red-500 h-8 px-2" onClick={() => removeItem(idx)}>
                  ✕
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem} className="text-xs">
            + Add another course
          </Button>
        </div>

        {/* Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total licences</span>
            <span className="font-medium">{totalLicences}</span>
          </div>
          {totalLicences >= 10 && (
            <div className="flex justify-between text-sm text-teal-700">
              <span>Volume discount</span>
              <span className="font-medium">
                {totalLicences >= 50 ? "20%" : totalLicences >= 25 ? "15%" : "10%"} off
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-3"
          onClick={handleSubmit}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? "Creating order..." : "Proceed to Checkout"}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Licences are activated by operators when they start studying. Unused licences can be reassigned.
        </p>
      </CardContent>
    </Card>
  );
}
