using {student.db} from '../db/coreModel';

service StudentService @(path: 'StudentServ') {
    entity Student          as projection on db.Student.Students;
    entity Qualifications   as projection on db.extras.Qualifications;
    entity AcademicRecords  as projection on db.Student.AcademicRecords;
    entity CompetitiveExams as projection on db.Student.CompetitiveExams;

    entity Applications     as projection on db.workflow.Applications
                               where
                                   student.email = $user;

    entity Documents        as projection on db.workflow.Documents;
    action submitApplication(applicationID: UUID) returns Applications;
}
