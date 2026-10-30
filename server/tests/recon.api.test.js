const request = require("supertest");
const app = require("../src/app");

describe("TradeRecon API", () => {
  describe("GET /api/recon", () => {
    test("should return reconciliation history", async () => {
      const response = await request(app).get("/api/recon");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/recon/:id", () => {
    test("should reject an invalid run ID", async () => {
      const response = await request(app).get("/api/recon/abc");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Invalid reconciliation run ID"
      );
    });

    test("should return 404 for a nonexistent run", async () => {
      const response = await request(app).get("/api/recon/999999999");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

describe("POST /api/recon", () => {
  test("should reject requests when files are missing", async () => {
    const response = await request(app)
      .post("/api/recon");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Both Internal and Custodian files are required"
    );
  });

  test("should reject CSV data with invalid numeric values", async () => {
    const internalCsv = [
      "trade_id,symbol,side,quantity,price,trade_date",
      "T101,AAPL,BUY,invalid,150.00,2026-10-28"
    ].join("\n");

    const custodianCsv = [
      "trade_id,symbol,side,quantity,price,trade_date",
      "T101,AAPL,BUY,10,150.00,2026-10-28"
    ].join("\n");

    const response = await request(app)
      .post("/api/recon")
      .attach("internalFile", Buffer.from(internalCsv), "internal.csv")
      .attach("custodianFile", Buffer.from(custodianCsv), "custodian.csv");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "CSV contains missing trade IDs or invalid numbers"
    );
  });

  test("should successfully reconcile valid CSV files", async () => {
    const internalCsv = [
      "trade_id,symbol,side,quantity,price,trade_date",
      "T101,AAPL,BUY,10,150.00,2026-10-28",
      "T102,MSFT,BUY,20,400.00,2026-10-28"
    ].join("\n");

    const custodianCsv = [
      "trade_id,symbol,side,quantity,price,trade_date",
      "T101,AAPL,BUY,10,150.00,2026-10-28",
      "T102,MSFT,BUY,18,400.00,2026-10-28"
    ].join("\n");

    const response = await request(app)
      .post("/api/recon")
      .attach("internalFile", Buffer.from(internalCsv), "internal.csv")
      .attach("custodianFile", Buffer.from(custodianCsv), "custodian.csv");

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.run_id).toBeDefined();
    expect(response.body.total_internal).toBe(2);
    expect(response.body.total_custodian).toBe(2);
    expect(response.body.matched).toBe(1);
    expect(response.body.breaks).toHaveLength(1);
    expect(response.body.breaks[0].break_type).toBe(
      "QUANTITY_MISMATCH"
    );
  });
});
