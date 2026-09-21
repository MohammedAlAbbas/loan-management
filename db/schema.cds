namespace loan.management;

using {managed} from '@sap/cds/common';

// type LoanStatus : String(1) enum {
//     D @title: 'Draft';
//     S @title: 'Submitted';
//     A @title: 'Approved';
//     R @title: 'Rejected';
// }

entity Employees : managed {
    key ID         : UUID;
        userId     : String(100);
        firstName  : String(50);
        lastName   : String(50);
        email      : String(255);
        department : String(100);

        loans      : Composition of many LoanApplications
                         on loans.employee = $self;
}

entity LoanStatuses : managed {
    key code : String(1);
        text : String(50);
}

entity LoanApplications : managed {
    key ID          : UUID;
        amount      : Decimal(15, 2);
        currency    : String(3);
        purpose     : String(255);
        submittedAt : Timestamp;

        status      : Association to one LoanStatuses;
        employee    : Association to one Employees;


}

entity LoanStatusTransitions {
    key fromStatus : Association to one LoanStatuses;
    key action     : String(20);
        toStatus   : Association to one LoanStatuses;
}

entity LoanStatusHistory : managed {
    key ID         : UUID;

        loan       : Association to one LoanApplications;

        fromStatus : Association to one LoanStatuses;
        toStatus   : Association to one LoanStatuses;

        action     : String(20);
}
