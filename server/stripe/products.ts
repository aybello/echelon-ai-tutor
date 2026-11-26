/**
 * Echelon Institute — Stripe Product Definitions (server re-export)
 *
 * The canonical product catalog lives in shared/products.ts.
 * This file re-exports everything from there so server-side code
 * continues to import from this path without changes.
 */

export type {
  EchelonProduct,
  ProductStudyPaths,
} from "../../shared/products";

export {
  INDIVIDUAL_PRODUCTS,
  ALL_PRODUCTS,
  PRODUCT_STUDY_PATHS,
  getUnlockedExamTypes,
  getAllUnlockedExamTypes,
} from "../../shared/products";
