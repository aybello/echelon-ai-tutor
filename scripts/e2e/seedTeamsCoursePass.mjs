import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

for (const [prefix, E2E_COURSE_KEY, databaseBank, province] of [
  ["teams", "wpi-class4-wastewater", "wpi-class4-wastewater", "western"],
  ["reporting", "class4-ww", "class4-wastewater", "ontario"],
]) {
const E2E_MANAGER_EMAIL = `${prefix}-e2e-manager@echelon.test`;
const E2E_OPERATOR_EMAIL = `${prefix}-e2e-operator@echelon.test`;
const E2E_ORG_NAME = `Echelon ${prefix} Browser QA`;

const connection = await mysql.createConnection(databaseUrl);
const now = new Date();
const termStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const termEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
const activationDeadline = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

try {
  await connection.beginTransaction();

  const [existingOrganizations] = await connection.execute(
    "SELECT id FROM organizations WHERE managerEmail = ? OR name = ?",
    [E2E_MANAGER_EMAIL, E2E_ORG_NAME],
  );
  const organizationIds = existingOrganizations.map((row) => Number(row.id));

  if (organizationIds.length > 0) {
    const placeholders = organizationIds.map(() => "?").join(",");
    await connection.execute(
      `DELETE FROM team_flex_licences WHERE organizationId IN (${placeholders})`,
      organizationIds,
    );
    await connection.execute(
      `DELETE FROM organization_members WHERE orgId IN (${placeholders})`,
      organizationIds,
    );
    await connection.execute(
      `DELETE FROM team_flex_order_items WHERE orderId IN (SELECT id FROM team_flex_orders WHERE organizationId IN (${placeholders}))`,
      organizationIds,
    );
    await connection.execute(
      `DELETE FROM team_flex_orders WHERE organizationId IN (${placeholders})`,
      organizationIds,
    );
    await connection.execute(
      `DELETE FROM organizations WHERE id IN (${placeholders})`,
      organizationIds,
    );
  }

  await connection.execute(
    "DELETE FROM email_otp_codes WHERE email IN (?, ?)",
    [E2E_MANAGER_EMAIL, E2E_OPERATOR_EMAIL],
  );

  const [organizationResult] = await connection.execute(
    `INSERT INTO organizations
      (name, province, tier, seatsTotal, managerEmail, termStart, termEnd, billingType, status)
     VALUES (?, ?, 'all-access', 0, ?, ?, ?, 'invoice', 'active')`,
    [E2E_ORG_NAME, province, E2E_MANAGER_EMAIL, termStart, termEnd],
  );
  const organizationId = Number(organizationResult.insertId);

  // Deliberately do not create a duplicate manager membership row. Checkout's
  // verified organizations.managerEmail is the manager authority, and the UI,
  // dashboard and Course Pass panel must agree on that same identity.
  const [orderResult] = await connection.execute(
    `INSERT INTO team_flex_orders
      (organizationId, managerEmail, totalLicences, subtotalCents, discountRate,
       discountCents, totalBeforeTaxCents, taxCents, totalPaidCents, currency,
       status, overlapAcknowledged, paidAt)
     VALUES (?, ?, 1, 29900, '0', 0, 29900, 0, 29900, 'cad', 'paid', 0, ?)`,
    [organizationId, E2E_MANAGER_EMAIL, now],
  );
  const orderId = Number(orderResult.insertId);

  const [itemResult] = await connection.execute(
    `INSERT INTO team_flex_order_items
      (orderId, courseKey, examFamily, pricingBand, courseLevel, termMonths,
       quantity, listUnitPriceCents, discountRate, discountedUnitPriceCents, lineTotalCents)
     VALUES (?, ?, ?, 'class4', 4, 12, 1, 29900, '0', 29900, 29900)`,
    [orderId, E2E_COURSE_KEY, province],
  );
  const orderItemId = Number(itemResult.insertId);

  await connection.execute(
    `INSERT INTO team_flex_licences
      (orderItemId, organizationId, courseKey, termMonths, status, activationDeadline)
     VALUES (?, ?, ?, 12, 'unused', ?)`,
    [orderItemId, organizationId, E2E_COURSE_KEY, activationDeadline],
  );

  // A complete synthetic 100-question bank exercises the real exam-size invariant.
  for (let number = 990001; number <= 990100; number++) {
    await connection.execute(
      `INSERT INTO questions (bankKey, questionNum, module, topic, question, options, correctIndex, explanation, reviewStatus)
       VALUES (?, ?, 'Safety & Admin', 'Safety & Admin', ?, ?, 0, 'Synthetic browser fixture.', 'approved')
       ON DUPLICATE KEY UPDATE question = VALUES(question)`,
      [databaseBank, number, `Browser QA question ${number}`, JSON.stringify(['Correct QA answer', 'Second QA answer', 'Third QA answer', 'Fourth QA answer'])],
    );
  }
  if (prefix === "reporting") {
    for (const productKey of ["class1-water", "class1-ww"]) {
      await connection.execute(
        `INSERT INTO purchases (email, productKey, productName, amountCAD, stripeSessionId)
         VALUES (?, ?, 'Synthetic reporting QA', 9900, ?) ON DUPLICATE KEY UPDATE email = VALUES(email)`,
        [E2E_OPERATOR_EMAIL, productKey, `cs_e2e_reporting_${productKey}`],
      );
    }
    for (const bank of ["class1", "class1-water", "class1-wastewater"]) {
      for (let number = 990001; number <= 990100; number++) {
        const module = bank === "class1-wastewater" || (bank === "class1" && number > 990050)
          ? "Wastewater Treatment" : "Water Treatment";
        await connection.execute(
          `INSERT INTO questions (bankKey, questionNum, module, topic, question, options, correctIndex, explanation, reviewStatus)
           VALUES (?, ?, ?, ?, ?, ?, 0, 'Synthetic browser fixture.', 'approved')
           ON DUPLICATE KEY UPDATE question = VALUES(question)`,
          [bank, number, module, module, `Class 1 QA ${number}`, JSON.stringify(['Correct', 'B', 'C', 'D'])],
        );
      }
    }
  }
  await connection.commit();
  console.log(JSON.stringify({ organizationId, orderId, managerEmail: E2E_MANAGER_EMAIL }));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}

}
