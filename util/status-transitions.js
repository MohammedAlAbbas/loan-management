const cds = require("@sap/cds");

async function getTransition(fromStatus, action) {

    return SELECT.one
        .from("loan.management.LoanStatusTransitions")
        .where({
            fromStatus_code: fromStatus,
            action: action
        });
}

async function validateTransition(req, fromStatus, action) {

    const transition = await getTransition(fromStatus, action);

    if (!transition) {
        return req.reject(
            400,
            `Action '${action}' is not allowed from status '${fromStatus}'`
        );
    }

    return transition;
}

async function addLoanStatusHistory(req, loanID, fromStatus, toStatus, action) {

    await INSERT.into("loan.management.LoanStatusHistory").entries({
        loan_ID: loanID,
        fromStatus_code: fromStatus,
        toStatus_code: toStatus,
        action: action,
        changedBy: req.user.id,
        changedAt: new Date()
    });
}

module.exports = {
    getTransition,
    validateTransition,
    addLoanStatusHistory
};