const reconcileTrades = require("../src/reconcile");

describe("Trade reconciliation", () => {
    test("identifies matched trades", () => {
        const internal = [
            {
                trade_id: "T101",
                quantity: 10,
                price: 150
            }
        ];

        const custodian = [
            {
                trade_id: "T101",
                quantity: 10,
                price: 150
            }
        ];

        const result = reconcileTrades(internal, custodian);

        expect(result.matched).toBe(1);
        expect(result.breaks).toHaveLength(0);
    });

    test("detects quantity mismatches", () => {
        const internal = [
            {
                trade_id: "T102",
                quantity: 20,
                price: 400
            }
        ];

        const custodian = [
            {
                trade_id: "T102",
                quantity: 18,
                price: 400
            }
        ];

        const result = reconcileTrades(internal, custodian);

        expect(result.breaks).toHaveLength(1);
        expect(result.breaks[0].break_type).toBe("QUANTITY_MISMATCH");
    });

    test("detects trades missing from custodian", () => {
        const internal = [
            {
                trade_id: "T103",
                quantity: 5,
                price: 120
            }
        ];

        const result = reconcileTrades(internal, []);

        expect(result.breaks[0].break_type).toBe("MISSING_IN_CUSTODIAN");
    });

    test("detects trades missing from internal records", () => {
        const custodian = [
            {
                trade_id: "T104",
                quantity: 8,
                price: 250
            }
        ];

        const result = reconcileTrades([], custodian);

        expect(result.breaks[0].break_type).toBe("MISSING_IN_INTERNAL");
    });

    test("allows price differences within tolerance", () => {
        const internal = [
            {
                trade_id: "T105",
                quantity: 10,
                price: 150
            }
        ];

        const custodian = [
            {
                trade_id: "T105",
                quantity: 10,
                price: 150.005
            }
        ];

        const result = reconcileTrades(internal, custodian);

        expect(result.matched).toBe(1);
        expect(result.breaks).toHaveLength(0);
    });
});