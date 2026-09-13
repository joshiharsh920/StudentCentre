sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, MessageBox, MessageToast) => {
    "use strict";

    const UPDATE_GROUP = "studentRegistration";

    return Controller.extend("centralstudentcentre.controller.Student", {
        onInit() {
            const oModel = this.getOwnerComponent().getModel();
            // Keep the new student and its academic records pending until Submit.
            this.clearStudentData();
            // Cancellation when the view is destroyed is expected.
            oContext.created().catch(() => { });
            this.getView().setBindingContext(oContext);
        },
        clearStudentData: function () {
            this._oStudentBinding = oModel.bindList("/Student", undefined, undefined, undefined, {
                $$updateGroupId: UPDATE_GROUP
            });
            const oContext = this._oStudentBinding.create({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                dateOfBirth: null,
                gender: "",
                country_code: null,
                address: "",
                academicRecords: []
            });
        },

        onAddAcademicRecord() {
            this.byId("academicRecordsTable").getBinding("items").create({
                qualification: "",
                board: "",
                institution: "",
                passingYear: null,
                obtainedMarks: null,
                maximumMarks: null,
                percentage: null
            });
        },

        async onSubmit() {
            const oView = this.getView();
            if (oView.getBusy()) {
                return;
            }
            const aInvalidControls = oView.findAggregatedObjects(true, (oControl) =>
                typeof oControl.getValueState === "function" && oControl.getValueState() === "Error"
            );
            if (aInvalidControls.length) {
                MessageBox.error("Please correct the highlighted fields before submitting.");
                return;
            }

            const oModel = this.getOwnerComponent().getModel();
            oView.setBusy(true);
            try {
                await oModel.submitBatch(UPDATE_GROUP);
                // Individual requests can fail even when the batch itself succeeds.
                if (oModel.hasPendingChanges(UPDATE_GROUP)) {
                    MessageBox.error("The student could not be saved. Check your entries and try again.");
                    return;
                }
                this.clearStudentData();
                MessageToast.show("Student saved successfully.");
            } catch (oError) {
                MessageBox.error(oError.message || "The student could not be saved. Please try again.");
            } finally {
                oView.setBusy(false);
            }
        },

        onExit() {
            this.getView().setBindingContext(null);
            if (this._oStudentBinding) {
                this._oStudentBinding.resetChanges();
                this._oStudentBinding.destroy();
            }
        }
    });
});
