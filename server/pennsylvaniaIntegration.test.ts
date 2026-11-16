import { eligibleCourseKeys } from "./interactiveContent/engine/compiler";
import { describe, expect, it } from "vitest";
import { PENNSYLVANIA_BANKS, PA_PRACTICE_MOCK } from "../shared/pennsylvaniaBanks";
import { InteractiveContentEngine } from "./interactiveContent/engine/loader";
import { getAllActiveCourseKeys, getCourseByKey, getCoursesForSubscriptionTier, courseKeyToTierStrict } from "../shared/courseRegistry";
import { classifyAppRoute } from "../shared/appRoutes";
import { matchedUSCourses, getStateBySlug, usCourseHref } from "../shared/usExamRouting";
import { getActiveIndividualProductByKey } from "../shared/products";
import { resolvePurchaseGateOffer, resolveQuizGateOffer } from "../shared/checkoutOffer";
import { selectCommercialAvailability } from "./commercialAvailability";
import { courseActivityScope } from "./courseActivityScope";
import { mockSpecification } from "./mockExamSession";
import { mockBlueprintForBank } from "./mockBlueprint";
import { resolveUSStudyContext } from "./usStudyContextServer";
import { FREE_EXAM_TYPES } from "./_core/access";
import { getAllSubscriptionExamTypes, allowedCourseKeysForOrg } from "./stripe/subscriptionProducts";

describe("Pennsylvania exact course identity and scope", () => {
  it("registers exactly 40 unique active non-309A courses while preserving the 38 game courses", () => {
    const keys = getAllActiveCourseKeys().filter(key => key !== "electrician-309a");
    expect(keys).toHaveLength(40);
    expect(new Set(keys).size).toBe(40);
    expect(keys.filter(key => !eligibleCourseKeys().includes(key)).sort()).toEqual(PENNSYLVANIA_BANKS.map(bank => bank.courseKey).sort());
  });
  it.each(PENNSYLVANIA_BANKS)("registers $courseKey without inventing a SKU, bank alias or access grant", bank => {
    const course = getCourseByKey(bank.courseKey)!;
    expect(course).toMatchObject({ isActive:true, examFamily:"us-state", track:bank.track, questionBankKey:bank.courseKey, productKey:bank.courseKey, teamAssignable:false, aliases:[] });
    expect(courseActivityScope(bank.courseKey,{requireActive:true}).keys).toEqual([bank.courseKey]);
    expect(FREE_EXAM_TYPES.has(bank.courseKey)).toBe(false);
    expect(eligibleCourseKeys()).not.toContain(bank.courseKey);
    expect(eligibleCourseKeys()).toHaveLength(38);
    expect(new InteractiveContentEngine().getCatalog(bank.courseKey, true)).toMatchObject({ available: false, version: null, modes: [] });
    expect(getActiveIndividualProductByKey(bank.courseKey)).toBeUndefined();
    expect(resolveQuizGateOffer(bank.courseKey).available).toBe(false);
    expect(resolvePurchaseGateOffer({productKey:bank.courseKey}).available).toBe(false);
    expect(selectCommercialAvailability([{key:bank.courseKey}],new Map([[bank.courseKey,bank.count]]))).toEqual([]);
    for(const family of ["ontario","western"] as const) {
      expect(courseKeyToTierStrict(bank.courseKey,family)).toBeNull();
      expect(getCoursesForSubscriptionTier("all-access",family).map(c=>c.courseKey)).not.toContain(bank.courseKey);
      expect(getAllSubscriptionExamTypes([{tier:"all-access",province:family}])).not.toContain(bank.courseKey);
      expect(allowedCourseKeysForOrg("all-access",family)).not.toContain(bank.courseKey);
    }
  });
  it("links exactly the two intended PA programs, never other states or PA treatment",()=>{
    const pa=getStateBySlug("pennsylvania")!;
    expect(matchedUSCourses(pa).map(c=>c.courseKey)).toEqual(PENNSYLVANIA_BANKS.map(b=>b.courseKey));
    expect(matchedUSCourses(pa,"water-treatment")).toEqual([]);
    expect(matchedUSCourses(pa,"wastewater-treatment")).toEqual([]);
    for(const bank of PENNSYLVANIA_BANKS) {
      const course=getCourseByKey(bank.courseKey)!;
      for(const tool of ["practice","mock","flashcards"] as const) {
        const href=usCourseHref(course,tool,"PA")!;
        expect(href).toContain(`country=US&state=PA`);
        expect(classifyAppRoute(href).kind).toBe("public");
        expect(usCourseHref(course,tool,"TX")).toBeNull();
      }
    }
    for(const path of ["/us/practice/us-class1-water","/us/mock/not-a-course","/us/flashcards/us-pa-class-e"]) expect(classifyAppRoute(path).kind).toBe("not-found");
  });
  it.each(PENNSYLVANIA_BANKS)("keeps $courseKey strictly Pennsylvania and US customary",bank=>{
    expect(resolveUSStudyContext(bank.courseKey)).toMatchObject({stateCode:"PA",stateName:"Pennsylvania",stream:bank.track,unitConvention:"us-customary"});
    for(const state of ["TX","CA","not-a-state",""]) expect(resolveUSStudyContext(bank.courseKey,state,"US")).toBeNull();
    expect(resolveUSStudyContext(bank.courseKey,"PA","CA")).toBeNull();
    expect(resolveUSStudyContext(bank.courseKey,"PA","US")?.criteriaEdition).toContain("not an official exam blueprint");
  });
  it.each(PENNSYLVANIA_BANKS)("uses independent practice settings without borrowing a WPI blueprint for $courseKey",bank=>{
    expect(mockSpecification(bank.courseKey)).toMatchObject({bankKey:bank.courseKey,courseKey:bank.courseKey,count:PA_PRACTICE_MOCK.count,scoredCount:100,duration:PA_PRACTICE_MOCK.duration});
    expect(mockBlueprintForBank(bank.courseKey,1)).toBeNull();
    expect(mockBlueprintForBank(bank.courseKey,2025)).toBeNull();
  });
});
