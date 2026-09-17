import cds from "@sap/cds";

export default cds.service.impl(function () {
    const { Students } = this.entities;

    this.before("CREATE", Students, function (req) {
        if (!req.data.firstName?.trim()) {
            req.reject(400, "First name is required");
        }
    });
});