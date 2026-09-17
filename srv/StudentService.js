import cds from "@sap/cds";

export default cds.service.impl(function () {
    const { Student } = this.entities;

    this.before("CREATE", Student, function (req) {
        if (!req.data.firstName?.trim()) {
            req.error(400, "First name is required", "firstName");
        }
    });
});
