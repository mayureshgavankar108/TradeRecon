const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

const db = require("../db");
const reconcileTrades = require("../reconcile");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

router.post(
    "/",
    upload.fields([
        { name: "internalFile", maxCount: 1 },
        { name: "custodianFile", maxCount: 1 }
    ]),
    (req, res) => {
        try {
            if (
                !req.files ||
                !req.files.internalFile ||
                !req.files.custodianFile
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Both Internal and Custodian files are required"
                });
            }

            const parseFile = (file) => {
                const records = parse(file.buffer.toString("utf8"), {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                });

                return records.map((row) => {
                    const quantity = Number(row.quantity);
                    const price = Number(row.price);

                    if (
                        !row.trade_id ||
                        !Number.isFinite(quantity) ||
                        !Number.isFinite(price)
                    ) {
                        throw new Error(
                            "CSV contains missing trade IDs or invalid numbers"
                        );
                    }

                    return {
                        trade_id: row.trade_id,
                        symbol: row.symbol,
                        side: row.side,
                        quantity,
                        price,
                        trade_date: row.trade_date
                    };
                });
            };

            const internalTrades = parseFile(req.files.internalFile[0]);
            const custodianTrades = parseFile(req.files.custodianFile[0]);

            const result = reconcileTrades(
                internalTrades,
                custodianTrades
            );

            const insertRun = db.prepare(`
                INSERT INTO recon_runs (
                    total_internal,
                    total_custodian,
                    matched,
                    breaks
                )
                VALUES (?, ?, ?, ?)
            `);

            const insertBreak = db.prepare(`
                INSERT INTO breaks (
                    run_id,
                    trade_id,
                    break_type,
                    internal_qty,
                    custodian_qty,
                    internal_price,
                    custodian_price
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const saveResults = db.transaction(() => {
                const run = insertRun.run(
                    result.total_internal,
                    result.total_custodian,
                    result.matched,
                    result.breaks.length
                );

                const runId = run.lastInsertRowid;

                for (const item of result.breaks) {
                    insertBreak.run(
                        runId,
                        item.trade_id,
                        item.break_type,
                        item.internal_qty,
                        item.custodian_qty,
                        item.internal_price,
                        item.custodian_price
                    );
                }

                return runId;
            });

            const runId = saveResults();

            return res.status(201).json({
                success: true,
                message: "Reconciliation completed successfully",
                run_id: runId,
                ...result
            });

        } catch (error) {
            console.error(error);

            return res.status(400).json({
                success: false,
                message: error.message || "Reconciliation failed"
            });
        }
    }
);

router.get('/breaks', (req, res) => {
    const filterType = req.query.filter;
    console.log(filterType);
    const filterQuery = db.prepare(`
        SELECT * FROM breaks WHERE break_type = ?;    
    `)
    const filterResult = filterQuery.all(filterType);
    if(filterResult.length == 0)
    {
        return res.status(404).json({
            "success" : false,
            "message" : "No Records Found For Given Filter"
        });
    }
    return res.status(200).json({
        "success" : true,
        "length" : filterResult.length,
        "filterResult" : filterResult
    });
});

router.get('/:id/breaks', (req, res) => {
    const record_id = Number(req.params.id);
    if (!Number.isInteger(record_id) || record_id <= 0) 
    {
        return res.status(400).json({
            success: false,
            message: "Invalid reconciliation run ID"
        });
    }
    const filterType = req.query.filter;
    const filterQuery = db.prepare(`
        SELECT * FROM breaks WHERE run_id = ? AND break_type = ?
    `);
    const filterResult = filterQuery.all(record_id, filterType);
    if(filterResult.length == 0)
    {
        return res.status(404).json({
            "success" : false,
            "message" : "No Records Found"
        });
    }
    return res.status(200).json({
        "success" : true,
        "filterResult" : filterResult
    });
});

router.get('/', (req, res) => {
    const result = db.prepare(`\
        SELECT * from recon_runs ORDER by r_id DESC;
    `);
    const rows = result.all();
    return res.status(200).json({
        "success" : true,
        "length" : rows.length,
        "result" : rows
    });
});

router.get('/:id', (req, res) =>{
    const record_id = Number(req.params.id);
    if (!Number.isInteger(record_id) || record_id <= 0) 
    {
        return res.status(400).json({
            success: false,
            message: "Invalid reconciliation run ID"
        });
    }
    const reconQuery = db.prepare(`
        SELECT * FROM recon_runs WHERE r_id = ?
    `);
    const reconResult = reconQuery.get(record_id);
    const breakQuery = db.prepare(`
        SELECT * FROM breaks WHERE run_id = ?;
    `);
    const breakResult = breakQuery.all(record_id);
    if(!reconResult)
    {
        return res.status(404).json({
            "success" : false,
            "message" : "No Records Found"
        });
    }
    return res.status(200).json({
        "success" : true,
        "reconResult" : reconResult,
        "breakResult" : breakResult
    });
});

module.exports = router;
