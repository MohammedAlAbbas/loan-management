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

                if (!oContext) {
                    return;
                }

                oMessageManager.removeAllMessages();
                oDialog.setBusy(true);

                const sUpdateGroupId = oModel.getUpdateGroupId();

                // Success handler: close dialog on successful context creation
                oContext.created().then(() => {
                    MessageToast.show("Loan application submitted successfully!");
                    oDialog.close();
                });

                // Batch completion handler: handles busy state & backend error display
                oModel.submitBatch(sUpdateGroupId).then(() => {
                    oDialog.setBusy(false);

                    if (oContext.isTransient()) {
                        const aMessages = oMessageManager.getMessageModel().getData();
                        const oErrorMsg = aMessages.find(m => m.getType() === "Error") || aMessages[0];

                        if (oErrorMsg && oErrorMsg.getMessage()) {
                            MessageBox.error(oErrorMsg.getMessage());
                        }
                    }
                }).catch((oError) => {
                    oDialog.setBusy(false);

                    if (oError && oError.message) {
                        MessageBox.error(oError.message);
                    }
                });
            },

            onCreateLoanCancel: function () {
                if (this._oCreateLoanDialog) {
                    this._oCreateLoanDialog.close();
                }
            },
            // ==========================================
            // EDIT LOAN
            // ==========================================

            onPressEditLoan: async function (oEvent) {
                const oButton = oEvent.getSource();
                const oContext = oButton.getBindingContext();

                if (!oContext) {
                    return;
                }

                // Load Edit Dialog fragment if not loaded yet
                if (!this._oEditLoanDialog) {
                    this._oEditLoanDialog = await Fragment.load({
                        id: this.getView().getId(),
                        name: "loan.management.ui.loanmanagementui.view.fragments.EditLoan",
                        controller: this
                    });
                    this.getView().addDependent(this._oEditLoanDialog);
                }

                sap.ui.getCore().getMessageManager().removeAllMessages();

                // Store context and bind it directly to the dialog
                this._oEditContext = oContext;
                this._oEditLoanDialog.setBindingContext(oContext);
                this._oEditLoanDialog.open();
            },

            onEditLoanConfirm: function () {
                const oModel = this.getView().getModel();
                const oDialog = this._oEditLoanDialog;
                const sUpdateGroupId = oModel.getUpdateGroupId();

                // Check if user changed any fields before sending a network call
                if (!oModel.hasPendingChanges(sUpdateGroupId)) {
                    MessageToast.show("No changes to save.");
                    oDialog.close();
                    return;
                }

                sap.ui.getCore().getMessageManager().removeAllMessages();
                oDialog.setBusy(true);

                // Flushes pending changes as an HTTP PATCH request
                oModel.submitBatch(sUpdateGroupId).then(() => {
                    oDialog.setBusy(false);

                    // If changes still exist in the update group, backend validation failed
                    if (oModel.hasPendingChanges(sUpdateGroupId)) {
                        const aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
                        const oErrorMsg = aMessages.find(m => m.getType() === "Error") || aMessages[0];

                        if (oErrorMsg && oErrorMsg.getMessage()) {
                            MessageBox.error(oErrorMsg.getMessage());
                        }
                    } else {
                        MessageToast.show("Loan application updated successfully!");
                        oDialog.close();
                    }
                }).catch((oError) => {
                    oDialog.setBusy(false);

                    if (oError && oError.message) {
                        MessageBox.error(oError.message);
                    }
                });
            },
            onEditLoanCancel: function () {
                const oModel = this.getView().getModel();
                const oMessageManager = sap.ui.getCore().getMessageManager();
                const sUpdateGroupId = oModel.getUpdateGroupId();

                // 1. Clear all error messages so red highlights/messages disappear
                oMessageManager.removeAllMessages();

                // 2. Reset the specific edit context if it has pending changes
                if (this._oEditContext && this._oEditContext.hasPendingChanges()) {
                    this._oEditContext.resetChanges();
                }

                // 3. Reset all changes in the update group to clear failed PATCH requests
                if (oModel && oModel.hasPendingChanges(sUpdateGroupId)) {
                    oModel.resetChanges(sUpdateGroupId);
                }

                // 4. Ensure dialog is not busy and close it safely
                if (this._oEditLoanDialog) {
                    this._oEditLoanDialog.setBusy(false);
                    this._oEditLoanDialog.close();
                }
            },
            // ============================================================
            // Delete Loan
            // ============================================================
            onPressDeleteLoan: function (oEvent) {
                // Get the context directly from the clicked button
                const oButton = oEvent.getSource();
                const oContext = oButton.getBindingContext();

                if (!oContext) {
                    return;
                }

                const sPurpose = oContext.getProperty("purpose");

                // 2. Prompt user for confirmation
                MessageBox.confirm(`Are you sure you want to delete "${sPurpose}"?`, {
                    title: "Delete Loan Application",
                    actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.DELETE,
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.DELETE) {
                            this._executeDelete(oContext);
                        }
                    }
                });
            },
            _executeDelete: function (oContext) {
                const oModel = this.getView().getModel();
                const oMessageManager = sap.ui.getCore().getMessageManager();
                const sUpdateGroupId = oModel.getUpdateGroupId();

                oMessageManager.removeAllMessages();

                // 1. Queue the deletion in the context's update group
                oContext.delete(sUpdateGroupId).then(() => {
                    // Success handler: executes when backend completes the DELETE operation
                    MessageToast.show("Loan application deleted successfully.");
                }).catch((oError) => {
                    // Error handler: executes if backend rejects deletion (e.g. status constraint/FK violation)
                    const aMessages = oMessageManager.getMessageModel().getData();
                    const oErrorMsg = aMessages.find(m => m.getType() === "Error") || aMessages[0];
                    const sMsg = oErrorMsg ? oErrorMsg.getMessage() : (oError ? oError.message : "Deletion failed.");

                    MessageBox.error(sMsg);
                });

                // 2. EXPLICITLY SUBMIT BATCH to send the queued DELETE request to the backend
                oModel.submitBatch(sUpdateGroupId);
            }
        }
    );
});