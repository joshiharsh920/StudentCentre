using {student.db} from '../db/coreModel';

service StudentService @(path: 'StudentServ') {
    entity Student          as projection on db.Student.Students;
    entity Qualifications   as projection on db.extras.Qualifications;
    entity Boards           as projection on db.extras.Boards;
    entity AcademicRecords  as projection on db.Student.AcademicRecords;
    entity CompetitiveExams as projection on db.Student.CompetitiveExams;

    entity Applications     as projection on db.workflow.Applications;

    action submitApplication(applicationID: UUID)   returns Applications;

    action updateApplicationStatus(applicationID: UUID,
                                   decision: String,
                                   remarks: String) returns Applications;
}
