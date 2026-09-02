using {
    cuid,
    managed,
    Country
} from '@sap/cds/common';

namespace student.db;

entity Students : cuid, managed {
    firstName       : String(100);
    lastName        : String(100);
    email           : String(255);
    phone           : String(15);
    dateOfBirth     : Date;
    gender          : String(20);

    country         : Country;
    address         : String(500);

    academicRecords : Composition of many AcademicRecords
                          on academicRecords.student = $self;

    examResults     : Composition of many ExamResults
                          on examResults.student = $self;

    preferences     : Composition of many Preferences
                          on preferences.student = $self;

    allotment       : Association to one Allotments
                          on allotment.student = $self;
}

entity AcademicRecords : cuid, managed {
    student       : Association to Students;
    qualification : String(50); // 10th, 12th, Diploma
    board         : String(100);
    institution   : String(200);
    passingYear   : Integer;
    obtainedMarks : Decimal(7, 2);
    maximumMarks  : Decimal(7, 2);
    percentage    : Decimal(5, 2);
}

entity CompetitiveExams : cuid, managed {
    name            : String(100);
    examYear        : Integer;
    registrationEnd : Date;
    resultDate      : Date;
    isActive        : Boolean default true;
}

entity ExamResults : cuid, managed {
    student      : Association to Students;
    exam         : Association to CompetitiveExams;
    rollNumber   : String(50);
    score        : Decimal(10, 2);
    percentile   : Decimal(6, 3);
    rank         : Integer;
    categoryRank : Integer;
}

entity Colleges : cuid, managed {
    name    : String(200);
    city    : String(100);
    state   : String(100);
    country : Country;

    courses : Composition of many CollegeCourses
                  on courses.college = $self;
}

entity Courses : cuid, managed {
    name          : String(150);
    degree        : String(100);
    durationYears : Integer;
}

entity CollegeCourses : cuid, managed {
    college      : Association to Colleges;
    course       : Association to Courses;
    totalSeats   : Integer;
    minimumScore : Decimal(10, 2);
}

entity Preferences : cuid, managed {
    student         : Association to Students;
    collegeCourse   : Association to CollegeCourses;
    preferenceOrder : Integer;
}

entity Allotments : cuid, managed {
    student       : Association to Students;
    collegeCourse : Association to CollegeCourses;
    roundNumber   : Integer;
    status        : String(30); // ALLOTTED, ACCEPTED, REJECTED
    allottedAt    : Timestamp;
}
