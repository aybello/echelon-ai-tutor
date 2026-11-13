// Offline scope, pinned independently of whichever packages happen to be present.
export const VERSION = 'content-engine-v1';
export const TARGET = 1000;
export const MODES = Object.freeze(['rapid-swipe', 'speed-match', 'odd-one-out', 'cause-effect', 'tap-the-flaw', 'before-after']);
export const DIFFICULTIES = Object.freeze(['easy', 'medium', 'hard', 'unclassified']);
export const COURSES = Object.freeze([
  'class1-wastewater-coll', 'class1-water', 'class1-water-dist', 'class1-ww',
  'class2-wastewater-coll', 'class2-water', 'class2-water-dist', 'class2-ww',
  'class3-wastewater-coll', 'class3-water', 'class3-water-dist', 'class3-ww',
  'class4-wastewater-coll', 'class4-water', 'class4-water-dist', 'class4-ww',
  'oit', 'oit-ww', 'us-class1-water', 'us-class1-water-dist', 'us-texas-class-d-water',
  'wpi-class1-wastewater', 'wpi-class1-water', 'wpi-class1-water-coll', 'wpi-class1-water-dist',
  'wpi-class2-wastewater', 'wpi-class2-water', 'wpi-class2-water-coll', 'wpi-class2-water-dist',
  'wpi-class3-wastewater', 'wpi-class3-water', 'wpi-class3-water-coll', 'wpi-class3-water-dist',
  'wpi-class4-wastewater', 'wpi-class4-water', 'wpi-class4-water-coll', 'wpi-class4-water-dist', 'wqa',
]);
export const RELEASE_RELATIVE = 'server/interactiveContent/release-2026-11-12';
// Fixed allowlist, not a user-selectable root. No output to source/public/build trees.
export const PRIVATE_ROOT = '/home/ubuntu/outputs/echelon-content-engine';
