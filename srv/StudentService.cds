using {student.db} from '../db/coreModel';

service StudentService @(path: 'StudentServ') {
    entity Student          as projection on db.Students;
    entity AcademicRecords  as projection on db.AcademicRecords;
    entity CompetitiveExams as projection on db.CompetitiveExams;
}
