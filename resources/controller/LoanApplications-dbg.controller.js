sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/Messaging"
], function (
    Controller,
    MessageToast,
    MessageBox,
    Fragment,
    Messaging
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
                    amount: "0.00",
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
            onCreateDialogAfterClose: function (oEvent) {
                if (this._oCreateContext && this._oCreateContext.isTransient()) {
                    const sGroupId = this.getView().getModel().getUpdateGroupId();
                    
                    // Pass the same groupId used during creation
                    this._oCreateContext.delete(sGroupId);
                    
                    this._oCreateContext = null;
                }
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
            //  Loan History
            // ============================================================
            onStatusHistoryPress: async function (oEvent) {
                const oButton = oEvent.getSource();
                const oContext = oButton.getBindingContext();

                if (!this._oLoanStatusHistoryDialog) {
                    this._oLoanStatusHistoryDialog = await sap.ui.core.Fragment.load({
                        name: "loan.management.ui.loanmanagementui.view.fragments.LoanStatusHistoryDialog",
                        controller: this
                    });

                    this.getView().addDependent(this._oLoanStatusHistoryDialog);
                }

                this._oLoanStatusHistoryDialog.setBindingContext(oContext);

                this._oLoanStatusHistoryDialog.open();
            },
            onStatusHistoryClose: function () {
                this._oLoanStatusHistoryDialog.close();
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
            },

            // ==========================================
            // LIFECYCLE ACTIONS (Submit, Approve, Reject)
            // ==========================================

            // ==========================================
            // ACTION BUTTON HANDLERS
            // ==========================================

            onSubmitLoan: function (oEvent) {
                // 1. Get the binding context of the selected row
                const oContext = oEvent.getSource().getBindingContext();
                if (!oContext) return;

                MessageBox.confirm("Are you sure you want to submit this loan application?", {
                    title: "Submit Loan",
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.OK) {
                            this._executeBoundAction(
                                oContext,
                                "EmployeeService.submitLoan",
                                "Loan application submitted successfully!"
                            );
                        }
                    }
                });
            },

            onApproveLoan: function (oEvent) {
                const oContext = oEvent.getSource().getBindingContext();
                if (!oContext) return;

                MessageBox.confirm("Are you sure you want to approve this loan application?", {
                    title: "Approve Loan",
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.OK) {
                            this._executeBoundAction(
                                oContext,
                                "EmployeeService.approveLoan",
                                "Loan application approved successfully!"
                            );
                        }
                    }
                });
            },

            onRejectLoan: function (oEvent) {
                const oContext = oEvent.getSource().getBindingContext();
                if (!oContext) return;

                // Prompt user for optional rejection reason
                // (Or call directly with a default parameter)
                this._executeBoundAction(
                    oContext,
                    "EmployeeService.rejectLoan",
                    "Loan application rejected.",
                    { reason: "Rejected via Manager Review" }
                );
            },

            // ==========================================
            // REUSABLE BOUND ACTION HELPER
            // ==========================================

            /**
             * Helper to call OData V4 Bound Action
             * @param {sap.ui.model.odata.v4.Context} oContext Selected row context
             * @param {string} sActionName Service.ActionName (e.g. "EmployeeService.submitLoan")
             * @param {string} sSuccessMessage Message Toast text
             * @param {object} [mParameters] Custom parameters (e.g. { reason: "..." })
             */
            _executeBoundAction: function (oContext, sActionName, sSuccessMessage, mParameters) {
                const oModel = this.getView().getModel();
                const oView = this.getView();

                Messaging.removeAllMessages();
                oView.setBusy(true);

                // 1. Bind context relative to the row context (oContext)
                // Generates path: /LoanApplications(ID=...)/EmployeeService.submitLoan(...)
                const oActionBinding = oModel.bindContext(`${sActionName}(...)`, oContext);

                // 2. Set custom parameters (like reason for rejection) if provided
                if (mParameters) {
                    Object.keys(mParameters).forEach((sKey) => {
                        oActionBinding.setParameter(sKey, mParameters[sKey]);
                    });
                }

                // 3. Execute HTTP POST
                oActionBinding.execute().then(() => {
                    oView.setBusy(false);
                    sap.m.MessageToast.show(sSuccessMessage);

                    // 4. Refresh row data so table updates status immediately
                    oContext.refresh();
                }).catch((oError) => {
                    oView.setBusy(false);

                    // Handle error messages from CAP backend
                    const aMessages = Messaging.getMessageModel().getData();
                    const oErrorMsg = aMessages.find(m => m.getType() === "Error") || aMessages[0];

                    if (oErrorMsg && oErrorMsg.getMessage()) {
                        sap.m.MessageBox.error(oErrorMsg.getMessage());
                    } else if (oError && oError.message) {
                        sap.m.MessageBox.error(oError.message);
                    } else {
                        sap.m.MessageBox.error("Action execution failed.");
                    }
                });
            }
        }
    );
});