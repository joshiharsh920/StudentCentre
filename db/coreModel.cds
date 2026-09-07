using {
    cuid,
    managed,
    Country
} from '@sap/cds/common';

namespace student.db;

context Student {
    entity Students : cuid, managed {
        firstName       : String(100);
        lastName        : String(100);
        email           : String(255);
        phone           : String(15);
        dateOfBirth     : Date;
        gender          : String(20);

        country         : Country;
        address         : String(500);
        city            : String(30);

        academicRecords : Composition of many AcademicRecords
                              on academicRecords.student = $self;

        examResults     : Composition of many ExamResults
                              on examResults.student = $self;

        allotment       : Association to one Allotments
                              on allotment.student = $self;
    }

    entity AcademicRecords : cuid, managed {
        student       : Association to Students;
        qualification : String(10); // 10th, 12th, Diploma
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

    entity Allotments : cuid, managed {
        student       : Association to Students;
        collegeCourse : Association to CollegeCourses;
        roundNumber   : Integer;
        status        : String(30); // ALLOTTED, ACCEPTED, REJECTED
        allottedAt    : Timestamp;
    }
}

context extras {
    entity Qualifications {
        key code : Integer;
            name : String;
    }
}

context workflow {
    type ApplicationStatus  : String enum {
        DRAFT;
        SUBMITTED;
        UNDER_VERIFICATION;
        CORRECTION_REQUIRED;
        APPROVED;
        ELIGIBLE;
        REJECTED;
    }

    type VerificationStatus : String enum {
        PENDING;
        VERIFIED;
        REJECTED;
    }

    entity Applications : cuid, managed {
        student            : Association to one Student.Students;
        status             : ApplicationStatus default 'DRAFT';
        submittedAt        : Timestamp;
        correctionReason   : String(1000);
        workflowInstanceID : String(100);
        verifiedAt         : Timestamp;
        verifiedBy         : String(255);

        documents          : Composition of many Documents
                                 on documents.application = $self;
    }

    entity Documents : cuid, managed {
        application      : Association to Applications;
        documentType     : String(50);
        fileName         : String(255);
        mimeType         : String(100);
        storageReference : String(500);
        status           : VerificationStatus default 'PENDING';
        rejectionReason  : String(1000);
    }

    entity VerificationTasks : cuid, managed {
        application : Association to Applications;
        taskType    : String(50);
        status      : String(30);
        assignedTo  : String(255);
        completedAt : Timestamp;
        remarks     : String(1000);
    }
}
