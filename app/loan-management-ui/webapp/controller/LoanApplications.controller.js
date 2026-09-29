sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (
    Controller,
    MessageToast,
    MessageBox,
    Fragment
) {
    "use strict";

    return Controller.extend(
        "loan.management.ui.loanmanagementui.controller.LoanApplications",
        {

            // ============================================================
            // Create Loan Dialog
            // ============================================================

            onCreateLoan: async function () {
                if (!this._oCreateLoanDialog) {
                    this._oCreateLoanDialog = await Fragment.load({
                        id: this.getView().getId(),
                        name: "loan.management.ui.loanmanagementui.view.fragments.CreateLoan",
                        controller: this
                    });
                    this.getView().addDependent(this._oCreateLoanDialog);
                }

                const oModel = this.getView().getModel();
                const oListBinding = this.byId("loanTable").getBinding("items");

                sap.ui.getCore().getMessageManager().removeAllMessages();

                // Pass empty strings/defaults rather than null so the framework tracks active property keys
                const oContext = oListBinding.create({
                    amount: "",
                    currency: "SAR",
                    purpose: ""
                }, true, {
                    groupId: oModel.getUpdateGroupId()
                });

                this._oCreateLoanDialog.setBindingContext(oContext);
                this._oCreateContext = oContext;

                this._oCreateLoanDialog.open();
            },

            onCreateLoanConfirm: function () {
                const oModel = this.getView().getModel();
                const oMessageManager = sap.ui.getCore().getMessageManager();
                const oDialog = this._oCreateLoanDialog;
                const oContext = this._oCreateContext;

                if (!oContext || this._bCreatingLoan) {
                    return;
                }

                oMessageManager.removeAllMessages();
                this._bCreatingLoan = true;
                oDialog.setBusy(true);

                const sUpdateGroupId = oModel.getUpdateGroupId();

                // Attach to created() promise
                oContext.created().then(() => {
                    MessageToast.show("Loan application submitted successfully!");
                    oDialog.close();
                }).catch((oError) => {
                    // Handled below if canceled or rejected
                });

                // submitBatch returns a Promise that resolves when the network batch completes
                oModel.submitBatch(sUpdateGroupId).then(() => {
                    oDialog.setBusy(false);
                    this._bCreatingLoan = false;

                    // Check if the context is still transient (meaning creation failed on the backend)
                    if (oContext.isTransient()) {
                        const aMessages = oMessageManager.getMessageModel().getData();
                        const oErrorMsg = aMessages.find(m => m.getType() === "Error");
                        const sMsg = oErrorMsg ? oErrorMsg.getMessage() : "Backend validation failed.";

                        MessageBox.error(sMsg);
                    }
                }).catch((oError) => {
                    // Executes if network fails completely (500, Offline, CORS)
                    oDialog.setBusy(false);
                    this._bCreatingLoan = false;
                    MessageBox.error(oError.message || "Network request failed.");
                });
            },

            // ============================================================
            // Cancel
            // ============================================================

            onCreateLoanCancel: function () {

                if (this._bCreatingLoan) {
                    return;
                }

                if (this._oCreateLoanDialog) {
                    this._oCreateLoanDialog.close();
                }
            }
        }
    );
});