# Western games content handoff — 2026-11-15

## Scope and provenance
Clean baseline `c5e8ba568e104fd6f1400bd965f32a1b72f37423`; release branch `release/western-games-20261115` in `/home/ubuntu/echelon-game-round-fix-20261113`. Exactly 77 ADDED authoring tables from the pinned `44339b1..60253447fe59532f7deef763839951cefc43ba6f` data-file diff, copied byte-for-byte. No historical Claude tree merge. Existing builder unchanged (SHA-256 `147d2e64fa22fa59bd9acc0e8c3fdb89064a619db46ed8db0606463229c67ac6`).

Final publication: **77/77 tables passed; 0 held; +21,795 course-level activity instances** across 16 Western courses and all six modes. Effective Western total: 1,568 → 23,363. Shared-pool derivatives are course-level instances, not globally distinct concepts.

Each table was checked sequentially against its combined existing course bank through the unchanged fail-closed builder, exact educational-payload owner-authorized Claude declaration, receipt registration, and combined registry compilation. Final regression additionally checks each accepted table against every other accepted addition for its course. Optional second review was not required by the owner. The exact Claude model and historical review timestamp were not supplied; no provider-authenticated record, independent review, human expert approval or WPI exam-outline alignment is claimed. Content is general operator knowledge, not protected examination wording. Source passages remain in private repository files, not this report.

The initial unpublished setup used overlong generated release IDs and failed the existing schema. It emitted no overlays. Only owned unregistered declarations were regenerated using the established short `og-{course}-{n}` convention; failed setup logs are retained separately. No source payload or validation rule was changed.

## Exact effective counts by course and mode

Each cell is baseline + accepted additions = effective total. Mode order is explicit.

| Course | rapid-swipe | speed-match | odd-one-out | before-after | cause-effect | tap-the-flaw | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| wpi-class1-wastewater | 22 + 247 = 269 | 10 + 197 = 207 | 15 + 285 = 300 | 20 + 208 = 228 | 20 + 203 = 223 | 20 + 218 = 238 | 1465 |
| wpi-class1-water-coll | 30 + 115 = 145 | 7 + 140 = 147 | 15 + 180 = 195 | 10 + 142 = 152 | 14 + 150 = 164 | 15 + 149 = 164 | 967 |
| wpi-class1-water-dist | 34 + 134 = 168 | 9 + 148 = 157 | 12 + 182 = 194 | 16 + 132 = 148 | 18 + 149 = 167 | 18 + 144 = 162 | 996 |
| wpi-class1-water | 28 + 311 = 339 | 10 + 201 = 211 | 15 + 328 = 343 | 14 + 244 = 258 | 15 + 226 = 241 | 19 + 249 = 268 | 1660 |
| wpi-class2-wastewater | 26 + 186 = 212 | 11 + 183 = 194 | 14 + 261 = 275 | 17 + 220 = 237 | 14 + 206 = 220 | 17 + 220 = 237 | 1375 |
| wpi-class2-water-coll | 26 + 166 = 192 | 12 + 175 = 187 | 9 + 255 = 264 | 14 + 190 = 204 | 14 + 202 = 216 | 21 + 199 = 220 | 1283 |
| wpi-class2-water-dist | 24 + 184 = 208 | 12 + 182 = 194 | 12 + 276 = 288 | 11 + 204 = 215 | 16 + 201 = 217 | 17 + 194 = 211 | 1333 |
| wpi-class2-water | 34 + 170 = 204 | 15 + 154 = 169 | 12 + 231 = 243 | 15 + 236 = 251 | 20 + 202 = 222 | 21 + 200 = 221 | 1310 |
| wpi-class3-wastewater | 26 + 212 = 238 | 10 + 193 = 203 | 15 + 306 = 321 | 21 + 262 = 283 | 17 + 227 = 244 | 20 + 243 = 263 | 1552 |
| wpi-class3-water-coll | 28 + 197 = 225 | 8 + 184 = 192 | 16 + 263 = 279 | 15 + 216 = 231 | 12 + 221 = 233 | 20 + 233 = 253 | 1413 |
| wpi-class3-water-dist | 22 + 219 = 241 | 12 + 197 = 209 | 16 + 337 = 353 | 14 + 231 = 245 | 16 + 224 = 240 | 11 + 216 = 227 | 1515 |
| wpi-class3-water | 26 + 200 = 226 | 13 + 155 = 168 | 13 + 271 = 284 | 17 + 294 = 311 | 15 + 217 = 232 | 10 + 202 = 212 | 1433 |
| wpi-class4-wastewater | 24 + 260 = 284 | 5 + 228 = 233 | 15 + 390 = 405 | 14 + 326 = 340 | 12 + 280 = 292 | 14 + 293 = 307 | 1861 |
| wpi-class4-water-coll | 24 + 242 = 266 | 13 + 213 = 226 | 16 + 323 = 339 | 15 + 251 = 266 | 12 + 267 = 279 | 13 + 278 = 291 | 1667 |
| wpi-class4-water-dist | 24 + 262 = 286 | 12 + 227 = 239 | 10 + 397 = 407 | 14 + 266 = 280 | 17 + 271 = 288 | 18 + 263 = 281 | 1781 |
| wpi-class4-water | 22 + 248 = 270 | 10 + 191 = 201 | 15 + 355 = 370 | 18 + 348 = 366 | 9 + 266 = 275 | 19 + 251 = 270 | 1752 |

The full 96-row baseline/addition/effective/session count evidence is in `expected-counts.json` and committed `docs/western-games-counts-20261115.json`.

## All 77 table decisions and source hashes

| Table | Course | Decision | Items | rapid-swipe | speed-match | odd-one-out | before-after | cause-effect | tap-the-flaw | Source SHA-256 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| wpi-class1-wastewater-o1 | wpi-class1-wastewater | passed | 216 | 61 | 24 | 54 | 28 | 24 | 25 | `826bd053062e2ae554dbef480422358d846971addff914c8a9c914397c0f711e` |
| wpi-class1-wastewater-o2 | wpi-class1-wastewater | passed | 217 | 51 | 24 | 60 | 32 | 24 | 26 | `6c48de992588a1b34b2f8ae1268572fede6a9467900896b8e2fb60ac19dd4e81` |
| wpi-class1-wastewater-t1 | wpi-class1-wastewater | passed | 347 | 65 | 35 | 92 | 68 | 45 | 42 | `23d772fd0f0359a867d7e9727c45551023e855da3e9600f10611fe58f0c6605b` |
| wpi-class1-wastewater-t2 | wpi-class1-wastewater | passed | 387 | 70 | 51 | 79 | 80 | 41 | 66 | `b25e117ba39bf80c7524f9a2b2ea85a7c475118eab085b34c3450e52f1dc0933` |
| wpi-class1-wastewater-t3 | wpi-class1-wastewater | passed | 191 | 0 | 63 | 0 | 0 | 69 | 59 | `77762ab94cf9d5d0ca1484d3cdfb822fdd554f3d0d5cf8547467e96744e3ea65` |
| wpi-class1-water-coll-t1 | wpi-class1-water-coll | passed | 361 | 69 | 35 | 96 | 70 | 42 | 49 | `b4340947c016f038a7483f6fab084d19764996b4e7d26c39263bc2ac92695efd` |
| wpi-class1-water-coll-t2 | wpi-class1-water-coll | passed | 351 | 46 | 45 | 84 | 72 | 53 | 51 | `b162f32bc2905a3358f1035fd8112097e4ab3a8a99202a82bf28324f25e8facf` |
| wpi-class1-water-coll-t3 | wpi-class1-water-coll | passed | 164 | 0 | 60 | 0 | 0 | 55 | 49 | `8413ddbe7f45bc359d3a2792ac96e505be46bdd8760f96bbc74941ece43eb495` |
| wpi-class1-water-dist-t1 | wpi-class1-water-dist | passed | 354 | 69 | 34 | 90 | 66 | 45 | 50 | `8eb54ac3e5dc50817513c93a472568acbbefd2cca4b2115b1ff527f914926ecc` |
| wpi-class1-water-dist-t2 | wpi-class1-water-dist | passed | 376 | 65 | 46 | 92 | 66 | 49 | 58 | `9d740614726cb084471430d6af776b467bd75ae9c09c80e90c3153ce603455cb` |
| wpi-class1-water-dist-t3 | wpi-class1-water-dist | passed | 159 | 0 | 68 | 0 | 0 | 55 | 36 | `35501676139e11ae6cb37720b800540a42be9a2c706bd79f8bbd15a843e6d2d3` |
| wpi-class1-water-o1 | wpi-class1-water | passed | 234 | 56 | 25 | 66 | 30 | 26 | 31 | `322c83110c66b50c942282ba64ca8d7ad0c307e33747cd3ac207affdb2d30a13` |
| wpi-class1-water-o2 | wpi-class1-water | passed | 241 | 82 | 22 | 59 | 30 | 23 | 25 | `44ad4f9189f7dab8def7ed3ff51d364e081c45587d7a92b49b469f0c561023fe` |
| wpi-class1-water-o3 | wpi-class1-water | passed | 249 | 53 | 35 | 54 | 38 | 27 | 42 | `7ceea72a6dac79078ec23bfeb0ace98f0fb9969157363780c76c32deefe821d8` |
| wpi-class1-water-t1 | wpi-class1-water | passed | 330 | 60 | 34 | 86 | 68 | 42 | 40 | `de4402fc8901d3beec48c3e25d183c206101a33e5e69c0c07017ad5a7405a81f` |
| wpi-class1-water-t2 | wpi-class1-water | passed | 334 | 60 | 36 | 63 | 78 | 45 | 52 | `46a6f193a1d2dfe47b8c6fcab17c2cbce84ad8fda2a9f8dd2c72d60d9a69d542` |
| wpi-class1-water-t3 | wpi-class1-water | passed | 171 | 0 | 49 | 0 | 0 | 63 | 59 | `8d1f5d9cdeda94f57c9381a7dab5f897d32af6c480618deb5bb5a2900afb0e15` |
| wpi-class2-wastewater-t1 | wpi-class2-wastewater | passed | 348 | 66 | 35 | 92 | 68 | 45 | 42 | `d7bf47d46a33b98351c56b409df1378f0dd766d720f50cf5145b8becc0617a22` |
| wpi-class2-wastewater-t2 | wpi-class2-wastewater | passed | 387 | 70 | 51 | 79 | 80 | 41 | 66 | `37482e87ec7cae1e6e0b3f1f02ff7fcbff9782d6337dbd0483b70f151db4b295` |
| wpi-class2-wastewater-t3 | wpi-class2-wastewater | passed | 191 | 0 | 63 | 0 | 0 | 69 | 59 | `e96d5f43dafaf9c0efa9d00ae078c4ddc4e040b2f504a8322c5fb6a509fc422a` |
| wpi-class2-wastewater-t4 | wpi-class2-wastewater | passed | 350 | 50 | 34 | 90 | 72 | 51 | 53 | `d2e8bf9958ce84fcd77768ecf0d06f6882465f048a1e93b9c7dd3ebebb286d8a` |
| wpi-class2-water-coll-t1 | wpi-class2-water-coll | passed | 361 | 69 | 35 | 96 | 70 | 42 | 49 | `8d535ecc3a89f341a07a3ca70bd503a020a76712a6df70576d6ffb1933ceb775` |
| wpi-class2-water-coll-t2 | wpi-class2-water-coll | passed | 351 | 46 | 45 | 84 | 72 | 53 | 51 | `bf8ba3e7eb0b4f6026f544cdf4ab212b381449c3f1ea17a7bc9c588c56e6accc` |
| wpi-class2-water-coll-t3 | wpi-class2-water-coll | passed | 164 | 0 | 60 | 0 | 0 | 55 | 49 | `0ee2aab6c88c503de8982c336c7bdb76e514acbf9aed71de1dde3298f616b3e4` |
| wpi-class2-water-coll-t4 | wpi-class2-water-coll | passed | 311 | 51 | 35 | 75 | 48 | 52 | 50 | `9b865d18f3edd7eb0863f90e4f716accba1ee795f081bd1f258bfaea968352ac` |
| wpi-class2-water-dist-t1 | wpi-class2-water-dist | passed | 354 | 69 | 34 | 90 | 66 | 45 | 50 | `8ca1919d1051a5ae967cc64a062b20035c6e34d4e73dea18d82c752959c0a424` |
| wpi-class2-water-dist-t2 | wpi-class2-water-dist | passed | 376 | 65 | 46 | 92 | 66 | 49 | 58 | `a16aab65c71d53bfd54b39e16b404817793a6b0ea9c73bb30f9a0fa69019b4e2` |
| wpi-class2-water-dist-t3 | wpi-class2-water-dist | passed | 159 | 0 | 68 | 0 | 0 | 55 | 36 | `e599997e505a4e230d00dab194cf984a450326d27ef037bcd371ddeecc7397a8` |
| wpi-class2-water-dist-t4 | wpi-class2-water-dist | passed | 352 | 50 | 34 | 94 | 72 | 52 | 50 | `bd459f4b5d50314978dc4ab25e3dddd820f3ba4747d433d215eed333f5e7a9de` |
| wpi-class2-water-t1 | wpi-class2-water | passed | 330 | 60 | 34 | 86 | 68 | 42 | 40 | `779e8bec78ed5a33c4bdcc01931858c3c54601c04ae82c5918c41ff33271c72f` |
| wpi-class2-water-t2 | wpi-class2-water | passed | 334 | 60 | 36 | 63 | 78 | 45 | 52 | `5397e8d4184a535fdbd326510d689cf740316c6d7de516bf18400c773ab962d2` |
| wpi-class2-water-t3 | wpi-class2-water | passed | 171 | 0 | 49 | 0 | 0 | 63 | 59 | `1b49d31f4b5a153d0000845fa38059b6bcc636309fcb57b1bcf9984bb42f7022` |
| wpi-class2-water-t4 | wpi-class2-water | passed | 358 | 50 | 35 | 82 | 90 | 52 | 49 | `4f39a0ce86b150e34e12f9b4ec9d92ca24f0070473b2c61df00b3f1eb318ff5a` |
| wpi-class3-wastewater-t1 | wpi-class3-wastewater | passed | 253 | 51 | 25 | 58 | 54 | 34 | 31 | `35be45df9bbb7214ff83d70b8c9e9c452be07225507d7d34070705c9eabc2cbb` |
| wpi-class3-wastewater-t2 | wpi-class3-wastewater | passed | 307 | 56 | 38 | 62 | 64 | 30 | 57 | `0f6f3cf501de36060980c833b3737cc87c462b7abeffb72f23633ad790effe62` |
| wpi-class3-wastewater-t3 | wpi-class3-wastewater | passed | 171 | 0 | 57 | 0 | 0 | 62 | 52 | `1e88654d43b99444cede94108107c933e0ba0033ae42ac4935de5ac552701447` |
| wpi-class3-wastewater-t4 | wpi-class3-wastewater | passed | 350 | 50 | 34 | 90 | 72 | 51 | 53 | `4c940ba6d8bbe189597da0085225aa156bf869e6fad921da9e3f3f3adaced63c` |
| wpi-class3-wastewater-t5 | wpi-class3-wastewater | passed | 362 | 55 | 39 | 96 | 72 | 50 | 50 | `3129b13fa435bad042f7ef8109a78f2c565cd063b100076b025daf4940d0ce6b` |
| wpi-class3-water-coll-t1 | wpi-class3-water-coll | passed | 268 | 60 | 30 | 60 | 40 | 34 | 44 | `1bd934db961fcfab2f7686e7da84778bcb2e169124126daa4b52ad2c7df9b204` |
| wpi-class3-water-coll-t2 | wpi-class3-water-coll | passed | 289 | 39 | 37 | 48 | 72 | 44 | 49 | `16ffef0d328c1ef51f76f54a6c5e56e1ef1c64f41d1ce533bfa83128fd7f1d83` |
| wpi-class3-water-coll-t3 | wpi-class3-water-coll | passed | 134 | 0 | 49 | 0 | 0 | 43 | 42 | `d16288cc6ba93f9a972174b657325d72aa57ca5b67d1144c1291be8ce39557f6` |
| wpi-class3-water-coll-t4 | wpi-class3-water-coll | passed | 311 | 51 | 35 | 75 | 48 | 52 | 50 | `f93646663e635bcefd656b59b3fe6922bdf10540307c3e53f2fa641f6a76f89c` |
| wpi-class3-water-coll-t5 | wpi-class3-water-coll | passed | 312 | 47 | 33 | 80 | 56 | 48 | 48 | `f9bb02c33741f48f74655369d66f017f86a56eeab0265ad594fbc5ec23012ab8` |
| wpi-class3-water-dist-t1 | wpi-class3-water-dist | passed | 277 | 60 | 24 | 74 | 44 | 36 | 39 | `9cd302ddd9318210f2c3d96bf5138170255b9158268b566f221a608bc34629cd` |
| wpi-class3-water-dist-t2 | wpi-class3-water-dist | passed | 364 | 60 | 44 | 92 | 66 | 49 | 53 | `5967f727b60b125240183d41d664a8f969da25047e3aab56fa960298dc587e2d` |
| wpi-class3-water-dist-t3 | wpi-class3-water-dist | passed | 124 | 0 | 61 | 0 | 0 | 38 | 25 | `0386611beb3ebd8a4e1a022dd1afe50093eaa28825e5e6cf7d66a4dfbb97ab5d` |
| wpi-class3-water-dist-t4 | wpi-class3-water-dist | passed | 352 | 50 | 34 | 94 | 72 | 52 | 50 | `c8da6ebf03cc04b22e3d2d9ad847ff116a0358b19cc459938db47ea6ac4b62d8` |
| wpi-class3-water-dist-t5 | wpi-class3-water-dist | passed | 307 | 49 | 34 | 77 | 49 | 49 | 49 | `44e7662d12019cd6563f94bd18063fbd3d0ebfa4cdbf6f64de86f68a048f9d6d` |
| wpi-class3-water-t1 | wpi-class3-water | passed | 230 | 46 | 22 | 52 | 52 | 32 | 26 | `36565f7010a9ed614201b7afb6057c99eb2bf93d21bc39192ffcff080b01c2a8` |
| wpi-class3-water-t2 | wpi-class3-water | passed | 230 | 41 | 23 | 35 | 62 | 32 | 37 | `3ee5c79fbc6e198f575226834be0bb4af4cf29d709883e4f545d56b8a2b36b3c` |
| wpi-class3-water-t3 | wpi-class3-water | passed | 119 | 0 | 31 | 0 | 0 | 49 | 39 | `38d73154315010a1909e79d3a164606bc005f71fdb07fe840e068628d9236b76` |
| wpi-class3-water-t4 | wpi-class3-water | passed | 358 | 50 | 35 | 82 | 90 | 52 | 49 | `23eb9a300bd54216facf7e87e919582a44ccda16c5ffe4accef20d01e2a44850` |
| wpi-class3-water-t5 | wpi-class3-water | passed | 402 | 63 | 44 | 102 | 90 | 52 | 51 | `840e7536f70a35464f86b1cebbd32897a6ec275aeb0e592709f33f311660939f` |
| wpi-class4-wastewater-t1 | wpi-class4-wastewater | passed | 253 | 51 | 25 | 58 | 54 | 34 | 31 | `c2b8ebeae37331fb1189ca606fb69bb91c3eee0df3f7b24a5065ad91addb6c11` |
| wpi-class4-wastewater-t2 | wpi-class4-wastewater | passed | 307 | 56 | 38 | 62 | 64 | 30 | 57 | `c44911c1d90ec727960bf04eaee1f8edf3b61a74f28747e8af3c70b7125da862` |
| wpi-class4-wastewater-t3 | wpi-class4-wastewater | passed | 171 | 0 | 57 | 0 | 0 | 62 | 52 | `aa3485e0c1d3a6db882d90aab2e983ce160eb66a114f336d7975006f5fc74f66` |
| wpi-class4-wastewater-t4 | wpi-class4-wastewater | passed | 350 | 50 | 34 | 90 | 72 | 51 | 53 | `d5ecd4600d7927c4370f29096e0c57a7ba2e4e6d199631d791ab3f71b3960ea7` |
| wpi-class4-wastewater-t5 | wpi-class4-wastewater | passed | 362 | 55 | 39 | 96 | 72 | 50 | 50 | `01d4d84fb217a01ddb48776203c4023482b7d13036361497f28298fb64dbe41f` |
| wpi-class4-wastewater-t6 | wpi-class4-wastewater | passed | 334 | 48 | 35 | 84 | 64 | 53 | 50 | `bd9bfc0706fc7ab4b9e9222cda1d672add6b422836256659cd9a8a74265bf01d` |
| wpi-class4-water-coll-t1 | wpi-class4-water-coll | passed | 268 | 60 | 30 | 60 | 40 | 34 | 44 | `068fd7ca8b22aa32531541cb9752962272de174b2f3ebc9e4df0f2ba71ce0a37` |
| wpi-class4-water-coll-t2 | wpi-class4-water-coll | passed | 289 | 39 | 37 | 48 | 72 | 44 | 49 | `1b5cd0075d1354c1dbd2ae0a53600e48122c832bbba716ca5acde3d1ce576906` |
| wpi-class4-water-coll-t3 | wpi-class4-water-coll | passed | 134 | 0 | 49 | 0 | 0 | 43 | 42 | `35578628dd2c022f94c45f152db77930d0c0d389bda0a29a32e79825744a2b17` |
| wpi-class4-water-coll-t4 | wpi-class4-water-coll | passed | 311 | 51 | 35 | 75 | 48 | 52 | 50 | `0e505f9e5ba5588c33374f58e8dea3d495122481bb6b0630bb625d0251b6762b` |
| wpi-class4-water-coll-t5 | wpi-class4-water-coll | passed | 312 | 47 | 33 | 80 | 56 | 48 | 48 | `64dfa9a9ff178e862842a4ba812488b2a61ab996c8e4ab9783c97096f5ec3caa` |
| wpi-class4-water-coll-t6 | wpi-class4-water-coll | passed | 260 | 45 | 29 | 60 | 35 | 46 | 45 | `7c92e2a97ee9b1686a347fce7177fe929a430b99723772c91dc1eb951269d59f` |
| wpi-class4-water-dist-t1 | wpi-class4-water-dist | passed | 277 | 60 | 24 | 74 | 44 | 36 | 39 | `3acdb4f5f48e9f8dffb2f11c1111d4dac7c41132dc25e873428fea7a7a116a8a` |
| wpi-class4-water-dist-t2 | wpi-class4-water-dist | passed | 364 | 60 | 44 | 92 | 66 | 49 | 53 | `ab86628b0ca7fcedaf71aff5e85b31ff1e90aab22ec2455f852ad1f7612412a7` |
| wpi-class4-water-dist-t3 | wpi-class4-water-dist | passed | 124 | 0 | 61 | 0 | 0 | 38 | 25 | `ac894f29dd3e556d1b7e4d08c21ec7e0a01413284ebc19d7751b17c247af9396` |
| wpi-class4-water-dist-t4 | wpi-class4-water-dist | passed | 352 | 50 | 34 | 94 | 72 | 52 | 50 | `1f03692207b8b2ea5d826c87dea7053498fde060a11ba7cf69a0958c17ab5b6b` |
| wpi-class4-water-dist-t5 | wpi-class4-water-dist | passed | 307 | 49 | 34 | 77 | 49 | 49 | 49 | `d0ae5a3f232ccf3bde207420b01f6421af4c427dda57d080fda80f4887a0a2a6` |
| wpi-class4-water-dist-t6 | wpi-class4-water-dist | passed | 262 | 43 | 30 | 60 | 35 | 47 | 47 | `710f4708ef756428521d617fb54f21c926617141633b78a9573325f3004430de` |
| wpi-class4-water-t1 | wpi-class4-water | passed | 230 | 46 | 22 | 52 | 52 | 32 | 26 | `d4f2cd3eb60eebbd21093be4c4eaac262492fa8c6eaa09c192a8676fceedd1b0` |
| wpi-class4-water-t2 | wpi-class4-water | passed | 230 | 41 | 23 | 35 | 62 | 32 | 37 | `ae897d44e26321579840ccc988bb10e896aa34f14ab2b8b9926f88be818b2c46` |
| wpi-class4-water-t3 | wpi-class4-water | passed | 119 | 0 | 31 | 0 | 0 | 49 | 39 | `5e7e3a22f82e5c5345767c0c596ddfc4307936d96be3acd8431c1a371b033bf7` |
| wpi-class4-water-t4 | wpi-class4-water | passed | 358 | 50 | 35 | 82 | 90 | 52 | 49 | `e3ddc0bb241149b907c308fe5d9cac9b80686488417733ba15c50d0b11cd855a` |
| wpi-class4-water-t5 | wpi-class4-water | passed | 402 | 63 | 44 | 102 | 90 | 52 | 51 | `136ab6715f4da17038b4df83dbd86ba92eaff144a24da616318c95beded06c41` |
| wpi-class4-water-t6 | wpi-class4-water | passed | 320 | 48 | 36 | 84 | 54 | 49 | 49 | `c3bf0c09aadba369014c7b34898ddb53ae2eae1f8223c174157ae610f2f407d6` |

## Held content and exclusions
Held new source tables: none. Existing original 129 exclusions are preserved exactly; ops appended only `oit` / `rapid-swipe` / `og-oit-b5-rapid-swipe-0018`, for 130 total. Its original overlay and explanation remain unchanged; **the bad explanation is excluded, not fixed**. Current exclusion SHA-256: `bf81d71ab4e0d7fc49ecb79e200276d21bc782b522ad089e3f583a1559642e23`.

Historical release tests retain their declared overlay snapshots and original 129-ID exclusion prefix hash. The earlier eleven-batch OIT rapid-swipe historical count has exactly the known -1 live-exclusion delta; other historical count assertions remain exact. The new Western regression covers the complete current registry, every Western course/mode, all current exclusions, unchanged OIT/OIT-WW pools relative to the pre-Western registry, and 309A rejection.

## Validation evidence

`historical-tests.log`:
```text
 Test Files  4 passed (4)
      Tests  129 passed (129)
   Duration  166.51s (transform 18.85s, setup 0ms, collect 53.57s, tests 110.76s, environment 1ms, prepare 947ms)
```

`western-tests.log`:
```text
 Test Files  1 passed (1)
      Tests  96 passed (96)
   Duration  155.77s (transform 25.27s, setup 0ms, collect 45.08s, tests 110.19s, environment 0ms, prepare 89ms)
```

All content commands used credential-free environment, test safety preload, disabled TSX cache, 8192 MB Node heap, and one Vitest worker. Publication and verification logs are in this output folder. Prior source tables, review declarations and overlay payload hashes remain unchanged. No API/research, DB writes, migrations, saved-progress enabling, pricing/entitlement, CSS, or runtime architecture changes were performed by content owner.

## Integration status
Content-owned commit: recorded in `content-commit-sha.txt` after focused validation. Ops commit and independent performance evidence are separately owned. Full combined TypeScript/build is intentionally delegated to parent after both commits; it has not been represented as passed by this content handoff. Parent owns PR, CI, merge and deployment checkpoints. No push or PR by content owner.
