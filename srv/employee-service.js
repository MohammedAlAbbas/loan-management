const cds = require("@sap/cds");
const { SELECT, UPDATE } = require("@sap/cds/lib/ql/cds-ql");
const Constants = require("../util/constants");
const StatusTransition = require("../util/status-transitions");

module.exports = cds.service.impl(function () {


    this.before('CREATE', 'LoanApplications', async (req) => {

        if (req.data.amount <= 0) {
            req.error(400, "Loan Amount must be greater than 0");
        }

        if (req.data.amount > 100000) {
            req.error(400, "Loan Amount cannot exceed 100,000 SAR");
        }

        if (req.data.currency !== "SAR") {
            req.error(400, "Loan Currency must be SAR");
        }

    });
    
    this.after("CREATE", "LoanApplications", async (loan, req) => {

        console.log("Created loan:", loan);
        console.log("Request data:", req.data);

    });

    // On Submit Loan Action:
    this.on(Constants.Actions.SUBMIT_LOAN, async (req) => {
        const { loanID } = req.data;
        const loan = await SELECT.one
                            .from("loan.management.LoanApplications")
                            .where({ ID: loanID });

        if(!loan) {
            return req.reject(404, "Loan not found");
        }

        await StatusTransition.validateTransition(req, loan.status_code, Constants.Actions.SUBMIT_LOAN );

        await UPDATE("loan.management.LoanApplications")
            .set({
                status_code: Constants.LoanStatus.SUBMITTED
            })
            .where({
                ID: loanID
            });

        return SELECT.one.from("loan.management.LoanApplications")
                .where({ ID: loanID });

    });

    // On Approve Loan Action:
    this.on(Constants.Actions.APPROVE_LOAN, async (req) => {
        const { loanID } = req.data;
        const loan = await SELECT.one
                            .from("loan.management.LoanApplications")
                            .where({ ID: loanID });

        if(!loan) {
            return req.reject(404, "Loan not found");
        }

        await StatusTransition.validateTransition(req, loan.status_code, Constants.Actions.APPROVE_LOAN );

        await UPDATE("loan.management.LoanApplications")
            .set({
                status_code: Constants.LoanStatus.APPROVED
            })
            .where({
                ID: loanID
            });

        return SELECT.one.from("loan.management.LoanApplications")
                .where({ ID: loanID });

    });

    // On Reject Loan Action:
    this.on(Constants.Actions.REJECT_LOAN, async (req) => {
        const { loanID } = req.data;
        const loan = await SELECT.one
                            .from("loan.management.LoanApplications")
                            .where({ ID: loanID });

        if(!loan) {
            return req.reject(404, "Loan not found");
        }

        await StatusTransition.validateTransition(req, loan.status_code, Constants.Actions.REJECT_LOAN );

        await UPDATE("loan.management.LoanApplications")
            .set({
                status_code: Constants.LoanStatus.REJECTED
            })
            .where({
                ID: loanID
            });

        return SELECT.one.from("loan.management.LoanApplications")
                .where({ ID: loanID });

    });


});
