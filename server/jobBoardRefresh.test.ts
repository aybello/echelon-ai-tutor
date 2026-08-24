import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAndIngest } from "./scripts/fetchJobs.mjs";
import {
  parseAwwOA,
  parseCwra,
  parseCwwa,
  parseSwwa,
} from "./scripts/fetchJobsAssociations.mjs";
import { ingestRss } from "./scripts/fetchJobsRss.mjs";
import { decodeHtmlEntities } from "./scripts/jobUtils.mjs";

const FIXED_NOW = new Date("2026-08-24T12:00:00.000Z");

function makeConnection(existingUrls: string[] = []) {
  const existing = new Set(existingUrls);
  const execute = vi.fn(async (query: string, params: unknown[] = []) => {
    if (query.startsWith("SELECT id FROM job_postings")) {
      return [existing.has(String(params[0])) ? [{ id: 42 }] : []];
    }
    if (query.includes("lastSeenAt <")) {
      return [{ affectedRows: 2 }];
    }
    return [{ affectedRows: 1 }];
  });
  const end = vi.fn().mockResolvedValue(undefined);
  return { execute, end };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("job board ingestion", () => {
  it("opens a connection per run, upserts jobs, expires stale rows, and closes", async () => {
    const connection = makeConnection(["https://jobs.test/existing"]);
    const createConnection = vi.fn().mockResolvedValue(connection);

    const result = await fetchAndIngest({
      databaseUrl: "mysql://test",
      createConnection,
      now: () => FIXED_NOW,
      ingestRss: async (upsertJob: (job: unknown) => Promise<void>) => {
        await upsertJob({
          title: "Existing operator",
          sourceUrl: "https://jobs.test/existing",
          sourceName: "Job Bank Canada",
        });
        await upsertJob({
          title: "New operator",
          sourceUrl: "https://jobs.test/new",
          sourceName: "Job Bank Canada",
        });
        return {
          errors: [],
          totalFetched: 2,
          successfulSources: 1,
          failedSources: 0,
        };
      },
      ingestMunicipal: async () => ({
        errors: [],
        totalFetched: 0,
        successfulSources: 1,
        failedSources: 0,
      }),
      ingestAssociations: async () => ({
        errors: [],
        totalFetched: 0,
        successfulSources: 4,
        failedSources: 0,
      }),
    });

    expect(createConnection).toHaveBeenCalledWith("mysql://test");
    expect(result).toMatchObject({
      ok: true,
      newCount: 1,
      seenCount: 1,
      processedCount: 2,
      expiredCount: 2,
      totalFetched: 2,
      successfulSources: 6,
      failedSources: 0,
    });
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("lastSeenAt <"),
      [new Date("2026-08-10T12:00:00.000Z")]
    );
    expect(connection.end).toHaveBeenCalledOnce();
  });

  it("preserves existing postings and reports failure when every source fails", async () => {
    const connection = makeConnection();

    const result = await fetchAndIngest({
      databaseUrl: "mysql://test",
      createConnection: vi.fn().mockResolvedValue(connection),
      now: () => FIXED_NOW,
      ingestRss: async () => ({
        errors: ["rss unavailable"],
        totalFetched: 0,
        successfulSources: 0,
        failedSources: 7,
      }),
      ingestMunicipal: async () => ({
        errors: ["municipal unavailable"],
        totalFetched: 0,
        successfulSources: 0,
        failedSources: 20,
      }),
      ingestAssociations: async () => ({
        errors: ["associations unavailable"],
        totalFetched: 0,
        successfulSources: 0,
        failedSources: 4,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Expiry skipped because no trustworthy upstream job set was returned; existing jobs were preserved"
    );
    expect(
      connection.execute.mock.calls.some(([query]) =>
        String(query).includes("lastSeenAt <")
      )
    ).toBe(false);
    expect(connection.end).toHaveBeenCalledOnce();
  });

  it("treats a zero-job parse as unhealthy and does not expire the board", async () => {
    const connection = makeConnection();

    const result = await fetchAndIngest({
      databaseUrl: "mysql://test",
      createConnection: vi.fn().mockResolvedValue(connection),
      ingestRss: async () => ({
        errors: [],
        totalFetched: 0,
        successfulSources: 6,
        failedSources: 1,
      }),
      ingestMunicipal: async () => ({
        errors: [],
        totalFetched: 0,
        successfulSources: 20,
        failedSources: 0,
      }),
      ingestAssociations: async () => ({
        errors: [],
        totalFetched: 0,
        successfulSources: 4,
        failedSources: 0,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.expiredCount).toBe(0);
    expect(
      connection.execute.mock.calls.some(([query]) =>
        String(query).includes("lastSeenAt <")
      )
    ).toBe(false);
    expect(connection.end).toHaveBeenCalledOnce();
  });

  it("closes the database connection when an ingestion tier throws", async () => {
    const connection = makeConnection();

    await expect(
      fetchAndIngest({
        databaseUrl: "mysql://test",
        createConnection: vi.fn().mockResolvedValue(connection),
        ingestRss: async () => {
          throw new Error("unexpected feed parser failure");
        },
        ingestMunicipal: async () => ({
          errors: [],
          totalFetched: 0,
          successfulSources: 0,
          failedSources: 0,
        }),
        ingestAssociations: async () => ({
          errors: [],
          totalFetched: 0,
          successfulSources: 4,
          failedSources: 0,
        }),
      })
    ).rejects.toThrow("unexpected feed parser failure");

    expect(connection.end).toHaveBeenCalledOnce();
  });
});

describe("association board parsers", () => {
  it("extracts AWWOA public listings", () => {
    const jobs = parseAwwOA(
      `<li><h3>Town of High Prairie</h3><span class="location">High Prairie, AB</span><span class="description"><a href="/public/download/files/360473">Utility Operator</a></span><span class="closing">Closing Date: September 20th, 2026</span></li>`
    );
    expect(jobs[0]).toMatchObject({
      title: "Utility Operator",
      company: "Town of High Prairie",
      province: "AB",
      sourceUrl: "https://www.awwoa.ca/public/download/files/360473",
    });
  });

  it("extracts SWWA public listings", () => {
    const jobs = parseSwwa(
      `<div class="item listing-item"><div class="list-column title">Uncertified Operator</div><div class="list-column location"><span>Location: </span>Yorkton, Saskatchewan</div><a class="btn apply" href="https://jobs.test/yorkton">Apply Now</a><div class="job-details article"><p><strong>City of Yorkton</strong></p><p>Water and wastewater treatment work.</p></div></div><div class="ajax-reload"></div>`
    );
    expect(jobs[0]).toMatchObject({
      title: "Uncertified Operator",
      company: "City of Yorkton",
      province: "SK",
      sourceUrl: "https://jobs.test/yorkton",
    });
  });

  it("extracts CWWA and CWRA public listings", () => {
    const cwwa = parseCwwa(
      `<div class="et_pb_row"><h4><span>Superintendent, Water Services Laboratories</span></h4><h4><span>Metro Vancouver Regional District</span></h4><a href="/job/123">Download</a></div>`
    );
    const cwra = parseCwra(
      `<p><strong>Position available:</strong> Wastewater Optimization Extension Specialist</p><p><strong>Location:</strong> Cambridge, Ontario</p><p>Support wastewater operators.</p><a href="https://jobs.test/grca">GRCA Career Opportunities</a>`
    );
    expect(cwwa[0]).toMatchObject({
      company: "Metro Vancouver Regional District",
      sourceUrl: "https://cwwa.ca/job/123",
    });
    expect(cwra[0]).toMatchObject({
      title: "Wastewater Optimization Extension Specialist",
      province: "ON",
      sourceUrl: "https://jobs.test/grca",
    });
  });
});

describe("RSS source isolation", () => {
  it("decodes numeric and named entities before jobs reach the UI", () => {
    expect(
      decodeHtmlEntities("Water &#038; Wastewater &#8211; Lead &amp; Operator")
    ).toBe("Water & Wastewater – Lead & Operator");
  });

  it("continues to every Job Bank feed when OWWA returns a Cloudflare page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("<html><title>One moment, please</title></html>", {
          status: 200,
        })
      )
      .mockImplementation(
        async () =>
          new Response("<feed><title>Job Bank</title></feed>", {
            status: 200,
            headers: { "Content-Type": "application/atom+xml" },
          })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await ingestRss(vi.fn());

    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(result).toMatchObject({
      totalFetched: 0,
      successfulSources: 6,
      failedSources: 1,
    });
    expect(result.errors).toContain(
      "RSS fetch skipped (OWWA): Cloudflare challenge detected"
    );
  });
});
