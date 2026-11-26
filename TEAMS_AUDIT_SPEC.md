# Claude Teams Audit Spec — Key Requirements

## Phase 2: organization_term_operator_usage table (DONE - table created)
- When assigning an operator: start transaction, resolve current term, check usage record exists
- If exists: reactivation does not consume another licence
- If not: count existing usage records for that term, reject if limit reached, else create usage record
- Must be safe under concurrent assignments (unique constraint handles this)

## Phase 3: Stripe renewal + seat downsizing
- Webhook must save both currentPeriodStart and currentPeriodEnd as termStart/termEnd
- Do NOT reactivate revoked operators during renewal
- Do NOT erase operator progress
- Seat downsizing: block if requested quantity < distinct operators used THIS TERM (not active count)

## Phase 4: Dashboard + Teams page + exam outcomes
- getOrgOverview returns: licensesTotal, licensesUsedThisTerm, licensesRemaining, activeOperators, termStart, termEnd, tier, allowedCourseKeys, province
- Dashboard cards: Annual licences used/purchased, Licences remaining, Active operators, Pass rate
- Teams page: remove "full All-Access" copy for single-stream, change "Certification level" to "Certification stream", use full labels (Water Treatment, Wastewater Treatment, Water Distribution, Wastewater Collection, All Streams)
- Course picker: filter by org's allowedCourseKeys
- Exam outcomes: validate email belongs to org, course was assigned, course in entitlement

## Phase 5: WPI Class IV Wastewater Collection bank
- Canonical key: wpi-class4-water-coll
- Fix blueprint weighting keys to match actual module names
- Blueprint weights must total 100%
- Replace single 150-question module with meaningful WPI-aligned topic modules
- Use WPI Need-to-Know Criteria as source

## Phase 6: 20 automated tests (see spec for full list)
- Entitlement tests (1-8), annual licence tests (9-14), progress survival (15), UI filter (16), exam outcome validation (17), Winnipeg route (18), All Streams orgs (19), legacy migration (20)
