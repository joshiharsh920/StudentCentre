sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("centralstudentcentre.controller.Student", {
        onInit() {
            this.getView().setModel(new JSONModel({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                dateOfBirth: null,
                gender: "",
                country_code: "",
                address: "",
                academicRecords: []
            }), "draft");
        },

        onAddAcademicRecord() {
            const oDraftModel = this.getView().getModel("draft");
            const aAcademicRecords = oDraftModel.getProperty("/academicRecords");

            aAcademicRecords.push({
                qualification: "",
                board: "",
                institution: "",
                passingYear: null,
                obtainedMarks: null,
                maximumMarks: null,
                percentage: null
            });
            oDraftModel.refresh(true);
        }
    });
});
