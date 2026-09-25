import cds from "@sap/cds";

export default class StudentService extends cds.ApplicationService {
    async init() {
        const { Student, Applications } = this.entities;
        const { SELECT, INSERT, UPDATE } = cds.ql;

        const BPA = await cds.connect.to("BPA");

        this.on("submitApplication", async (req) => {
            // Your UI currently sends Student.ID in this parameter.
            const studentID = req.data.applicationID;

            const student = await SELECT.one
                .from(Student)
                .where({ ID: studentID });

            if (!student) {
                return req.reject(404, "Student not found");
            }

            const insertResult = await INSERT.into(Applications).entries({
                student_ID: student.ID,
                status: "DRAFT"
            });

            const [createdApplication] = [...insertResult];
            const applicationID = createdApplication.ID;

            try {
                await BPA.send({
                    method: "POST",
                    path: "/workflow/rest/v1/workflow-instances",
                    headers: {
                        "Content-Type": "application/json",
                        "api-key": "oZ8dM-Oz5voiWg_HL5_kfNIrW-tB649B"
                    },
                    data: {
                        definitionId:
                            "us10.03736cd4trial.studentregistrationapproval.studentApprovalProcess",
                        context: {
                            // BPA must send this ID back when it calls
                            // updateApplicationStatus.
                            applicationID: applicationID,
                            studentId: student.ID,
                            firstName: student.firstName,
                            lastName: student.lastName,
                            email: student.email,
                            phone: student.phone,
                            gender: student.gender,
                            address: student.address
                        }
                    }
                });
            } catch (error) {
                console.error("Failed to start BPA workflow:", error);
                return req.reject(
                    502,
                    "The approval workflow could not be started."
                );
            }

            await UPDATE(Applications)
                .set({
                    status: "SUBMITTED",
                    submittedAt: new Date()
                })
                .where({ ID: applicationID });

            return SELECT.one
                .from(Applications)
                .where({ ID: applicationID });
        });

        this.on("updateApplicationStatus", async (req) => {
    const { applicationID, decision, remarks } = req.data;
    const status = String(decision ?? "").toUpperCase();

    console.log("BPA applicationID:", applicationID);
    console.log("Request tenant:", req.tenant);
    console.log("Service entity:", Applications.name);

    if (!applicationID) {
        return req.reject(400, "applicationID was not provided");
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
        return req.reject(400, "Decision must be APPROVED or REJECTED");
    }

    let application;

    try {
        application = await SELECT.one
            .from(Applications)
            .where({ ID: applicationID });

        console.log(
            "Found through service entity:",
            application?.ID ?? "NO"
        );

        // Diagnostic read of the underlying CDS database entity.
        const dbEntity =
            cds.model.definitions["student.db.workflow.Applications"];

        if (dbEntity) {
            const dbApplication = await cds.db.run(
                SELECT.one
                    .from(dbEntity)
                    .columns("ID", "student_ID", "status")
                    .where({ ID: applicationID })
            );

            console.log(
                "Found in bound database:",
                dbApplication?.ID ?? "NO"
            );
            console.log(
                "Database row's student_ID:",
                dbApplication?.student_ID ?? "NO"
            );
        } else {
            console.log(
                "Database entity student.db.workflow.Applications " +
                "not found in deployed CDS model"
            );
        }
    } catch (error) {
        console.error("Application lookup failed:", error);
        return req.reject(500, "Could not read the application");
    }

    if (!application) {
        return req.reject(404, "Application not found");
    }

    try {
        await UPDATE(Applications)
            .set({
                status,
                verifiedAt: new Date(),
                correctionReason:
                    status === "REJECTED" ? remarks ?? null : null
            })
            .where({ ID: applicationID });

        return await SELECT.one
            .from(Applications)
            .where({ ID: applicationID });
    } catch (error) {
        console.error("Application update failed:", error);
        return req.reject(500, "Could not update the application");
    }
});

        return super.init();
    }
}