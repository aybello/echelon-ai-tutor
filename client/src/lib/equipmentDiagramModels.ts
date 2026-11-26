/** Deterministic conceptual sections. Coordinates are SVG user units, not dimensions. */
export type DiagramTone = "concrete" | "steel" | "water" | "teal" | "air" | "sludge" | "media" | "white" | "ink" | "none";
export interface DiagramShape { d: string; fill: DiagramTone; stroke: DiagramTone; width: number }
export interface DiagramPart {
  id: string;
  anchor: readonly [number, number];
  labelAt: readonly [number, number];
  side: "left" | "right" | "top" | "bottom";
  shapes: readonly DiagramShape[];
}
export interface DiagramFlow {
  d: string;
  medium: "water" | "air" | "sludge" | "grit" | "pilot";
  from: string;
  to: string;
}
export interface EquipmentDiagramModel {
  description: string;
  base: readonly DiagramShape[];
  parts: readonly DiagramPart[];
  flows: readonly DiagramFlow[];
  notes?: readonly { x: number; y: number; text: string }[];
}
const P = (d: string, fill: DiagramTone = "none", stroke: DiagramTone = "ink", width = 2): DiagramShape => ({ d, fill, stroke, width });
const R = (x: number, y: number, w: number, h: number, fill: DiagramTone = "steel") => P(`M${x} ${y}h${w}v${h}h${-w}Z`, fill);
const E = (x: number, y: number, rx: number, ry: number, fill: DiagramTone = "steel") => P(`M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`, fill);
const pipe = (d: string, tone: DiagramTone = "water") => [P(d, "none", "steel", 18), P(d, "none", tone, 12)];
const part = (id: string, anchor: readonly [number, number], side: DiagramPart["side"], labelAt: readonly [number, number], shapes: DiagramShape[]): DiagramPart => ({ id, anchor, side, labelAt, shapes });
const flow = (d: string, from: string, to: string, medium: DiagramFlow["medium"] = "water"): DiagramFlow => ({ d, from, to, medium });
const tank = (x: number, y: number, w: number, h: number) => [R(x, y, w, h, "concrete"), R(x + 10, y + 10, w - 20, h - 20, "water")];

/** Keys use slugs deliberately: these do not depend on the registry's sceneId union. */
export const EQUIPMENT_DIAGRAM_MODELS: Readonly<Record<string, EquipmentDiagramModel>> = {
  "aeration-basin": {
    description: "Side section of an activated sludge basin. Influent and settled biomass returned from a downstream secondary clarifier enter at the head. Blower air goes only to the floor diffuser grid; bubbles rise through mixed liquor. A separate waste-sludge branch removes biomass to solids handling. The downstream clarifier is outside this section.",
    base: [R(225, 145, 285, 145, "concrete"), P("M235 155V280H500V155", "none", "ink", 2), ...pipe("M500 176H570")],
    parts: [
      part("mixed-liquor", [440, 207], "right", [602, 191], [R(236, 164, 264, 105, "water")]),
      part("influent-channel", [196, 179], "left", [118, 150], [...pipe("M140 179H236")]),
      part("ras-line", [203, 249], "bottom", [207, 351], [...pipe("M560 296H203V197H236", "sludge")]),
      part("was-line", [472, 296], "bottom", [518, 351], [...pipe("M455 296V274H568", "sludge")]),
      part("blower", [203, 116], "top", [208, 27], [R(170, 97, 62, 38), E(195, 116, 12, 12, "white"), P("M189 110L202 116L189 123Z", "teal"), ...pipe("M232 116H266V258", "air")]),
      part("diffuser-grid", [345, 259], "bottom", [362, 351], [P("M266 259H473", "none", "air", 7), ...[286, 328, 370, 412, 454].flatMap(x => [R(x - 12, 255, 24, 8, "teal"), E(x, 235, 3, 3, "white"), E(x + 5, 215, 3, 3, "white"), E(x - 3, 190, 2, 2, "white")])]),
      part("do-probe", [467, 179], "top", [512, 27], [R(457, 119, 20, 14), P("M467 133V187", "none", "steel", 5), E(467, 189, 5, 7, "teal")]),
    ],
    flows: [flow("M153 179H225", "influent-channel", "mixed-liquor"), flow("M310 176H397", "mixed-liquor", "secondary-clarifier"), flow("M516 176H560", "mixed-liquor", "secondary-clarifier"), flow("M244 116H266V242", "blower", "diffuser-grid", "air"), flow("M525 296H203V212", "secondary-clarifier", "ras-line", "sludge"), flow("M208 197H226", "ras-line", "mixed-liquor", "sludge"), flow("M455 296V274H555", "ras-line", "solids-handling", "sludge")],
    notes: [{ x: 415, y: 320, text: "Sludge from clarifier → RAS / WAS split" }, { x: 536, y: 155, text: "To clarifier" }],
  },
  "centrifugal-pump": {
    description: "Side cutaway centrifugal pump. Water enters axially from the left into the impeller eye. Impeller vanes accelerate it radially into a widening volute casing and the upward discharge. The motor on the right drives the impeller through a shaft, not through the water pipe.",
    base: [R(236, 286, 316, 10, "concrete"), R(276, 262, 35, 24), R(471, 258, 42, 28)],
    parts: [
      part("casing", [347, 241], "bottom", [362, 351], [P("M271 134C217 132 205 199 235 244C263 286 326 280 351 240C365 217 363 167 330 148V107H301V136C291 132 281 132 271 134Z", "steel"), P("M272 145C228 143 219 198 245 237C270 272 318 266 341 233C355 207 351 176 320 157V117H311V149C294 143 283 144 272 145Z", "water")]),
      part("suction", [190, 204], "left", [118, 190], [...pipe("M140 204H268")]),
      part("discharge", [315, 119], "top", [363, 27], [...pipe("M315 149V91")]),
      part("motor", [493, 214], "right", [602, 197], [R(433, 173, 117, 84), E(550, 215, 12, 42), ...[449, 464, 479, 494, 509, 524].map(x => P(`M${x} 181V249`, "none", "ink", 1.5))]),
      part("shaft", [388, 204], "bottom", [514, 351], [R(291, 198, 145, 12), R(366, 189, 18, 30, "steel")]),
      part("impeller", [287, 191], "top", [208, 27], [P("M270 165H283L309 173L324 190V223L309 240L283 247H270Z", "teal"), ...[175, 195, 215, 235].map(y => P(`M282 ${y}L310 ${y + 3}`, "none", "white", 3)), E(272, 204, 12, 15, "water")]),
    ],
    flows: [flow("M151 204H254", "suction", "impeller"), flow("M275 194L300 163", "impeller", "casing"), flow("M315 139V97", "casing", "discharge")],
    notes: [{ x: 359, y: 321, text: "Axial inlet • radial discharge • shaft-driven impeller" }],
  },
  "rapid-gravity-filter": {
    description: "Side section in filtration service only. Inlet water fills the supernatant above layered filter media, flows downward through media to the underdrain, then exits through the filtered-water outlet. An elevated wash trough collects dirty wash water during a separate backwash operation; no backwash flow is shown.",
    base: [R(235, 103, 262, 189, "concrete")],
    parts: [
      part("supernatant", [403, 153], "top", [361, 27], [R(245, 116, 242, 77, "water")]),
      part("inlet", [193, 143], "left", [118, 133], [...pipe("M140 143H245")]),
      part("media", [396, 220], "right", [602, 190], [R(245, 193, 242, 28, "media"), R(245, 221, 242, 25, "sludge"), R(245, 246, 242, 13, "steel"), ...[267, 299, 331, 363, 395, 427, 459].flatMap(x => [E(x, 210, 2, 2, "ink"), E(x + 8, 236, 3, 2, "media")])]),
      part("underdrain", [365, 276], "bottom", [362, 351], [R(245, 259, 242, 23, "water"), P("M258 269H475", "none", "teal", 5), ...[267, 299, 331, 363, 395, 427, 459].map(x => P(`M${x} 259V270`, "none", "ink", 3))]),
      part("outlet", [537, 270], "bottom", [519, 351], [...pipe("M475 270H578")]),
      part("wash-trough", [287, 164], "top", [208, 27], [P("M260 149V169H314V149", "none", "steel", 7), P("M263 155H311", "none", "white", 4)]),
    ],
    flows: [flow("M152 143H230", "inlet", "supernatant"), flow("M355 156V224", "supernatant", "media"), flow("M429 227V269", "media", "underdrain"), flow("M502 270H565", "underdrain", "outlet")],
    notes: [{ x: 363, y: 319, text: "FILTRATION SERVICE • Backwash is a separate mode" }],
  },
  "chlorine-contact-tank": {
    description: "Top-down contact tank. Alternating baffles force a serpentine route: down the first pass, up the second, down the third and up the final pass. Water exits at the end of that final pass. A sample tap is downstream of the outlet, not at the tank inlet. The path is conceptual and does not establish a validated contact time.",
    base: [...tank(220, 112, 298, 180)],
    parts: [
      part("contact-zone", [478, 224], "right", [602, 192], [R(232, 124, 274, 156, "water")]),
      part("inlet", [187, 145], "left", [118, 134], [...pipe("M140 145H232")]),
      part("baffles", [369, 263], "bottom", [361, 351], [R(293, 123, 12, 119, "concrete"), R(363, 162, 12, 119, "concrete"), R(433, 123, 12, 119, "concrete")]),
      part("outlet", [526, 145], "top", [511, 27], [...pipe("M506 145H578")]),
      part("sample-point", [557, 173], "bottom", [519, 351], [P("M557 145V194", "none", "teal", 5), P("M550 170L564 183M564 170L550 183", "none", "ink", 2), R(551, 190, 12, 8, "steel")]),
    ],
    flows: [flow("M151 145H260V245", "inlet", "contact-zone"), flow("M260 245V261Q260 266 272 266H322Q334 266 334 252V149Q334 141 346 141H391Q405 141 405 154V252Q405 266 417 266H460Q477 266 477 248V158Q477 145 490 145H566", "contact-zone", "outlet")],
    notes: [{ x: 365, y: 318, text: "Top view • Serpentine service path • Sample after contact" }],
  },
  "uv-reactor": {
    description: "Horizontal UV reactor with its shell cut away. Water enters at the left, flows along quartz sleeves surrounding UV lamps, and exits at the right. The UV intensity sensor is mounted on the reactor wall. Lamps are inside protective quartz sleeves; they are not water pipes.",
    base: [R(259, 269, 20, 19), R(439, 269, 20, 19)],
    parts: [
      part("reactor", [312, 142], "top", [207, 27], [R(239, 131, 241, 138, "steel"), R(250, 142, 220, 116, "water"), E(240, 200, 16, 69, "steel"), E(480, 200, 16, 69, "steel")]),
      part("inlet", [185, 200], "left", [118, 183], [...pipe("M140 200H239")]),
      part("outlet", [540, 200], "right", [602, 183], [...pipe("M480 200H580")]),
      part("sleeves", [425, 236], "bottom", [364, 351], [R(261, 170, 196, 14, "white"), R(261, 222, 196, 14, "white")]),
      part("lamps", [319, 177], "top", [361, 27], [P("M267 177H450M267 229H450", "none", "teal", 5)]),
      part("sensor", [428, 150], "top", [514, 27], [R(419, 109, 18, 22), P("M428 131V151", "none", "ink", 4), E(428, 154, 6, 5, "teal")]),
    ],
    flows: [flow("M151 200H224", "inlet", "reactor"), flow("M277 201H433", "reactor", "outlet"), flow("M505 200H566", "reactor", "outlet")],
    notes: [{ x: 364, y: 317, text: "Water surrounds sleeves • UV lamps stay inside quartz" }],
  },
  "bar-screen": {
    description: "Side section of an inclined bar screen spanning a channel. Water passes left to right through the bars. The rake travels upward along the upstream screen face and lifts retained debris above water level into a screenings chute. This removes coarse solids, not dissolved contamination.",
    base: [R(147, 279, 429, 13, "concrete"), P("M150 211H574", "none", "teal", 1)],
    parts: [
      part("upstream", [220, 241], "left", [118, 213], [R(150, 214, 161, 64, "water")]),
      part("downstream", [468, 244], "right", [602, 213], [P("M354 214H574V278H316Z", "water")]),
      part("bars", [335, 225], "bottom", [361, 351], [P("M302 279L400 103M316 279L414 103", "none", "steel", 7), ...[144, 170, 196, 222, 248, 270].map(y => { const x = 400 - (y - 103) * 98 / 176; return P(`M${x - 4} ${y}h25`, "none", "ink", 2); })]),
      part("screenings", [466, 139], "top", [511, 27], [P("M401 116H431L488 155H530V171H482L426 132H401Z", "steel"), R(500, 180, 52, 88, "concrete"), P("M507 257L516 236L528 246L541 227V259Z", "sludge"), E(465, 142, 5, 4, "sludge")]),
      part("rake", [350, 177], "top", [207, 27], [P("M291 264L385 103", "none", "teal", 5), P("M337 182L354 192M340 177L357 187M343 172L360 182", "none", "ink", 4), E(381, 105, 9, 9, "steel"), E(310, 227, 5, 4, "sludge")]),
    ],
    flows: [flow("M173 243H275", "upstream", "bars"), flow("M359 243H472", "bars", "downstream"), flow("M311 247L375 133", "rake", "screenings", "grit")],
    notes: [{ x: 360, y: 318, text: "Water through bars → • Retained screenings lifted above water" }],
  },
  "grit-chamber": {
    description: "Longitudinal grit chamber section. Wastewater moves through a channel while dense mineral grit settles into the bottom hopper. A bottom extraction line carries grit slurry to an external inclined classifier. The outlet has reduced grit but is not biologically treated effluent.",
    base: [P("M205 143H453V231L373 287H279L205 231Z", "concrete")],
    parts: [
      part("chamber", [299, 184], "top", [207, 27], [R(216, 156, 226, 74, "water")]),
      part("inlet", [179, 174], "left", [118, 162], [...pipe("M140 174H216")]),
      part("outlet", [493, 174], "right", [602, 159], [...pipe("M442 174H580")]),
      part("grit-hopper", [333, 262], "bottom", [208, 351], [P("M216 230H442L367 278H285Z", "water"), P("M282 263H372L352 278H299Z", "media"), ...pipe("M326 278V294H479V235", "sludge")]),
      part("classifier", [528, 222], "bottom", [514, 351], [P("M466 239L535 199L570 126L582 132L546 214L477 253Z", "steel"), P("M480 240L537 207L574 133", "none", "media", 5), ...[150, 168, 186].map(y => P(`M${566 - (y - 150) / 2} ${y}l13 6`, "none", "ink", 2)), R(532, 273, 34, 18, "media"), P("M574 132V264", "none", "ink", 2)]),
    ],
    flows: [flow("M151 174H205", "inlet", "chamber"), flow("M242 174H421", "chamber", "outlet"), flow("M460 174H566", "chamber", "outlet"), flow("M305 204V252", "chamber", "grit-hopper", "grit"), flow("M326 281V294H479V257", "grit-hopper", "classifier", "grit"), flow("M499 227L535 207L568 143", "grit-hopper", "classifier", "grit")],
    notes: [{ x: 360, y: 322, text: "Grit separation only • Organic load remains in outlet water" }],
  },
  "lift-station": {
    description: "Side-cut lift station wet well with two submersible pumps. Incoming wastewater accumulates in the well. Each pump connects to its own rising discharge and check valve before the branches join a discharge header outside the well. An overhead level sensor monitors the wet-well surface. Check valves prevent reverse flow; this is pumping, not treatment.",
    base: [R(226, 108, 254, 184, "concrete"), R(236, 118, 234, 164, "white"), R(226, 100, 254, 12, "concrete")],
    parts: [
      part("wet-well", [350, 203], "right", [602, 196], [R(236, 196, 234, 86, "water"), P("M241 196H465", "none", "teal", 2)]),
      part("inlet", [190, 178], "left", [118, 166], [...pipe("M140 178H251"), P("M251 178V208", "none", "water", 12)]),
      part("riser", [414, 164], "bottom", [513, 351], [...pipe("M291 250H323V133H539V108H580"), ...pipe("M382 250H414V133")]),
      part("pump", [286, 256], "bottom", [208, 351], [R(263, 235, 40, 37, "teal"), E(283, 239, 20, 10, "steel"), R(273, 216, 20, 22), R(354, 235, 40, 37, "teal"), E(374, 239, 20, 10, "steel"), R(364, 216, 20, 22), P("M264 273H305M355 273H396", "none", "ink", 4)]),
      part("check-valve", [323, 152], "top", [513, 27], [R(311, 143, 24, 22, "white"), P("M315 160L331 148M315 146H331", "none", "ink", 3), R(402, 143, 24, 22, "white"), P("M406 160L422 148M406 146H422", "none", "ink", 3)]),
      part("level-sensor", [353, 128], "top", [207, 27], [R(341, 92, 24, 19), E(353, 122, 9, 7, "teal"), P("M353 130L336 184M353 130L370 184", "none", "teal", 1)]),
    ],
    flows: [flow("M151 178H251V204", "inlet", "wet-well"), flow("M323 225V172", "pump", "check-valve"), flow("M414 225V172", "pump", "check-valve"), flow("M323 137V133H380", "check-valve", "riser"), flow("M450 133H539V108H566", "riser", "force-main")],
    notes: [{ x: 361, y: 320, text: "Two pump branches • Each check valve precedes the common header" }],
  },
  "pressure-reducing-valve": {
    description: "Side section of a pilot-operated pressure-reducing valve. Main water flow passes left to right through a seat controlled by the bonnet diaphragm. A small strainer is only on the upstream pilot feed. The external pilot contains an adjustable spring; a separate sensing connection reaches the downstream outlet. Pilot control tubing connects to the diaphragm chamber, not a main-line filter.",
    base: [P("M287 206V189Q287 163 321 160H373Q407 163 407 189V206", "steel")],
    parts: [
      part("inlet", [197, 238], "left", [118, 224], [...pipe("M140 238H290")]),
      part("outlet", [524, 238], "right", [602, 224], [...pipe("M406 238H580")]),
      part("diaphragm", [348, 181], "bottom", [362, 351], [P("M284 208H410V267H369V244H325V267H284Z", "steel"), P("M290 218H329V234H365V218H404V256H375V238H320V256H290Z", "water"), P("M302 181H392", "none", "teal", 7), P("M347 183V231", "none", "ink", 6), R(327, 230, 40, 9, "teal"), P("M323 244H371", "none", "ink", 4)]),
      part("pilot", [453, 144], "top", [512, 27], [P("M190 238V151H454V170H370M454 170H529V238", "none", "teal", 3), R(438, 126, 33, 40, "steel"), P("M448 154H462M455 145V162", "none", "ink", 3)]),
      part("strainer", [227, 151], "top", [207, 27], [R(216, 144, 22, 14, "white"), P("M220 156L229 146M227 156L236 146", "none", "ink", 1.5), P("M227 158V167H235", "none", "steel", 3)]),
      part("spring", [455, 114], "top", [362, 27], [R(442, 94, 26, 33, "white"), P("M455 91V99L447 104L463 109L447 114L463 119L455 124", "none", "ink", 2), P("M447 91H463", "none", "ink", 3)]),
    ],
    flows: [flow("M151 238H275", "inlet", "diaphragm"), flow("M301 237H314V250H380V237H399", "diaphragm", "outlet"), flow("M434 238H568", "diaphragm", "outlet"), flow("M190 203V151H206", "inlet", "strainer", "pilot"), flow("M245 151H426", "strainer", "pilot", "pilot"), flow("M432 170H376", "pilot", "diaphragm", "pilot")],
    notes: [{ x: 362, y: 314, text: "Small upstream pilot strainer • Downstream pressure sensing" }],
  },
};

/** Short perimeter labels wrap without clipping or changing the registry's wording. */
export function wrapEquipmentLabel(label: string, limit = 18): string[] {
  const lines: string[] = [];
  const words = label.split(/\s+/).filter(Boolean).flatMap(word => {
    if (word.length <= limit) return [word];
    // Keep hyphens visible at natural breaks; split unusually long unbroken tokens.
    return (word.match(/[^-]+-?/g) ?? [word]).flatMap(piece => {
      const chunks: string[] = [];
      for (let i = 0; i < piece.length; i += limit) chunks.push(piece.slice(i, i + limit));
      return chunks;
    });
  });
  for (const word of words) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + word.length + 1 <= limit) lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines;
}
