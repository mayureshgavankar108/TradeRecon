function reconcileTrades(internalTrades, custodianTrades)
{
    const breaks = [];

    const custodianMap = new Map(
        custodianTrades.map(trade => [trade.trade_id, trade])
    );

    const matchedCustodianIds = new Set();

    let matched = 0;

    for(const internal of internalTrades)
    {
        const custodian = custodianMap.get(internal.trade_id);

        if(!custodian)
        {
            breaks.push({
                trade_id : internal.trade_id,
                break_type : "MISSING_IN_CUSTODIAN",
                internal_qty : internal.quantity,
                custodian_qty : null,
                internal_price : internal.price,
                custodian_price : null
            });
            continue;
        }

        matchedCustodianIds.add(custodian.trade_id);

        if(custodian.quantity !== internal.quantity)
        {
            breaks.push({
                trade_id : internal.trade_id,
                break_type : "QUANTITY_MISMATCH",
                internal_qty : internal.quantity,
                custodian_qty : custodian.quantity,
                internal_price : internal.price,
                custodian_price : custodian.price
            });
            continue;
        }

        if(Math.abs(internal.price - custodian.price) > 0.01)
        {
            breaks.push({
                trade_id : internal.trade_id,
                break_type : "PRICE_MISMATCH",
                internal_qty : internal.quantity,
                custodian_qty : custodian.quantity,
                internal_price : internal.price,
                custodian_price : custodian.price
            });
            continue;
        }

        matched++;
    }

    const internalIds = new Set(
        internalTrades.map(trade => trade.trade_id)
    );

    for(const custodian of custodianTrades) {
        if (!internalIds.has(custodian.trade_id)) {
            breaks.push({
                trade_id: custodian.trade_id,
                break_type: "MISSING_IN_INTERNAL",
                internal_qty: null,
                custodian_qty: custodian.quantity,
                internal_price: null,
                custodian_price: custodian.price
            });
        }
    }

    return {
        total_internal : internalTrades.length,
        total_custodian : custodianTrades.length,
        matched,
        breaks
    };
}

module.exports = reconcileTrades;