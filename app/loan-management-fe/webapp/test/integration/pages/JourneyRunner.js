sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"loan/management/fe/loanmanagementfe/test/integration/pages/LoanApplicationsList.gen",
	"loan/management/fe/loanmanagementfe/test/integration/pages/LoanApplicationsObjectPage.gen"
], function (JourneyRunner, LoanApplicationsListGenerated, LoanApplicationsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('loan/management/fe/loanmanagementfe') + '/test/flp.html#app-preview',
        pages: {
			onTheLoanApplicationsListGenerated: LoanApplicationsListGenerated,
			onTheLoanApplicationsObjectPageGenerated: LoanApplicationsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

