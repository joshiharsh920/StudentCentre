sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Messaging"
], (Controller, MessageBox, MessageToast, Messaging) => {
    "use strict";

    const UPDATE_GROUP = "studentRegistration";

    return Controller.extend("centralstudentcentre.controller.Student", {
        onInit() {
            // Keep the new student and its academic records pending until Submit.
            this.clearStudentData();
        },
        clearStudentData: function () {
            this._academicDocuments = new Map();
            this.getView().setBindingContext(null);
            if (this._oStudentBinding) {
                this._oStudentBinding.destroy();
            }
            var oModel = this.getOwnerComponent().getModel();
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
            // Cancellation when the view is destroyed is expected.
            oContext.created().catch(() => { });
            this.getView().setBindingContext(oContext);
            return oContext;
        },

        onAddAcademicRecord() {
            this.byId("academicRecordsTable").getBinding("items").create({
                // Keep a stable key when deep creation replaces child contexts.
                ID: crypto.randomUUID(),
                qualification: "",
                board: "",
                institution: "",
                passingYear: null,
                obtainedMarks: null,
                maximumMarks: null,
                percentage: null,
                documentFileName: null,
                documentMimeType: null
            });
        },

        onAcademicDocumentChange(oEvent) {
            const oFile = oEvent.getParameter("files")?.[0];
            if (!oFile) {
                return;
            }
            const oContext = oEvent.getSource().getBindingContext();
            this._academicDocuments.set(oContext.getProperty("ID"), oFile);
            oContext.setProperty("documentFileName", oFile.name);
            oContext.setProperty("documentMimeType", oFile.type || "application/octet-stream");
        },

        async _uploadAcademicDocuments() {
            if (!this._academicDocuments.size) {
                return;
            }
            const sServiceRoot = this.getOwnerComponent().getManifestEntry(
                "/sap.app/dataSources/mainService/uri"
            ).replace(/\/$/, "");
            const oTokenResponse = await fetch(`${sServiceRoot}/`, {
                credentials: "same-origin",
                headers: { "X-CSRF-Token": "Fetch" }
            });
            if (!oTokenResponse.ok) {
                throw new Error("Could not prepare document upload. Please submit again.");
            }
            const sToken = oTokenResponse.headers.get("X-CSRF-Token");
            for (const [sRecordID, oFile] of this._academicDocuments) {
                const mHeaders = { "Content-Type": oFile.type || "application/octet-stream" };
                if (sToken) {
                    mHeaders["X-CSRF-Token"] = sToken;
                }
                const oResponse = await fetch(
                    `${sServiceRoot}/AcademicRecords(${sRecordID})/document`,
                    { method: "PUT", credentials: "same-origin", headers: mHeaders, body: oFile }
                );
                if (!oResponse.ok) {
                    throw new Error(`Could not upload ${oFile.name}. Please submit again to retry.`);
                }
                this._academicDocuments.delete(sRecordID);
            }
        },

        _getBackendErrors(oModel) {
            return Messaging.getMessageModel().getData().filter((oMessage) =>
               oMessage.getType() === "Error"
            );
        },

        async onSubmit() {
            const oView = this.getView();
            if (oView.getBusy()) {
                return;
            }
            const oModel = this.getOwnerComponent().getModel();
            // Remove the previous server errors so corrected data can be retried.
            // Client-side validation messages use a different message processor.
            Messaging.removeMessages(this._getBackendErrors(oModel));
            const aInvalidControls = oView.findAggregatedObjects(true, (oControl) =>
                typeof oControl.getValueState === "function" && oControl.getValueState() === "Error"
            );
            if (aInvalidControls.length) {
                MessageBox.error("Please correct the highlighted fields before submitting.");
                return;
            }

            oView.setBusy(true);
            try {
                await oModel.submitBatch(UPDATE_GROUP);
                // Individual requests can fail even when the batch itself succeeds.
                const aErrors = this._getBackendErrors(oModel);
                if (aErrors.length || oModel.hasPendingChanges(UPDATE_GROUP)) {
                    const sMessage = [...new Set(aErrors.map((oMessage) =>
                        oMessage.getMessage()
                    ))].join("\n");
                    MessageBox.error(sMessage || "The student could not be saved. Check your entries and try again.");
                    return;
                }
                // Media uploads require persisted academic records.
                await this._uploadAcademicDocuments();
                // Get the ID of the Student that was just created
                const oStudentContext = oView.getBindingContext();
                const sApplicationID = oStudentContext.getProperty("ID");

                console.log("Student ID:", sApplicationID);

                // Call CAP submitApplication action
                const oAction = oModel.bindContext("/submitApplication(...)");

                oAction.setParameter("applicationID", sApplicationID);

                await oAction.execute();
                this.clearStudentData();
                MessageToast.show("Student saved successfully.");
            } catch (oError) {
                MessageBox.error(oError.message || "The student could not be saved. Please try again.");
            } finally {
                oView.setBusy(false);
            }
        },

        onExit() {
            this._academicDocuments.clear();
            this.getView().setBindingContext(null);
            if (this._oStudentBinding) {
                this._oStudentBinding.resetChanges();
                this._oStudentBinding.destroy();
            }
        },
        onMarksChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const oItem = oInput.getParent();
            const oContext = oItem.getBindingContext();
            const oRecord = oContext.getObject();

            if (oRecord.obtainedMarks !== null && oRecord.maximumMarks !== null && oRecord.maximumMarks !== 0) {
                const percentage = (oRecord.obtainedMarks / oRecord.maximumMarks) * 100;
                oContext.setProperty("percentage", percentage.toFixed(2));
            }
        }
    });
});
