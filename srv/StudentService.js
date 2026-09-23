import cds from "@sap/cds";

export default class StudentService extends cds.ApplicationService {

    async init() {

        const { Applications } = this.entities;
        const { SELECT, UPDATE } = cds.ql;


        // =====================================================
        // SUBMIT APPLICATION
        // =====================================================
        this.on("submitApplication", async (req) => {

            const { applicationID } = req.data;

            // Check whether application exists
            const application = await SELECT.one
                .from(Applications)
                .where({ ID: applicationID });

            if (!application) {
                return req.reject(404, "Application not found");
            }

            // Only draft application can be submitted
            if (application.status !== "DRAFT") {
                return req.reject(
                    400,
                    "Only a DRAFT application can be submitted"
                );
            }

            // Update status
            await UPDATE(Applications)
                .set({
                    status: "SUBMITTED",
                    submittedAt: new Date()
                })
                .where({ ID: applicationID });


            // TODO:
            // Start BPA workflow here


            // Return updated application
            return await SELECT.one
                .from(Applications)
                .where({ ID: applicationID });
        });


        // =====================================================
        // UPDATE APPLICATION STATUS
        // Called by BPA after Approve / Reject
        // =====================================================
        this.on("updateApplicationStatus", async (req) => {

            const {
                applicationID,
                decision,
                remarks
            } = req.data;


            // Only these decisions are allowed
            if (!["APPROVED", "REJECTED"].includes(decision)) {
                return req.reject(
                    400,
                    "Decision must be APPROVED or REJECTED"
                );
            }


            // Check application exists
            const application = await SELECT.one
                .from(Applications)
                .where({ ID: applicationID });

            if (!application) {
                return req.reject(
                    404,
                    "Application not found"
                );
            }


            // Update application
            await UPDATE(Applications)
                .set({
                    status: decision,
                    verifiedAt: new Date(),

                    correctionReason:
                        decision === "REJECTED"
                            ? remarks
                            : null
                })
                .where({ ID: applicationID });


            // Return updated application
            return await SELECT.one
                .from(Applications)
                .where({ ID: applicationID });
        });


        return super.init();
    }
}