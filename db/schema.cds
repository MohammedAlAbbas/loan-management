namespace loan.management;

// type LoanStatus : String(1) enum {
//     D @title: 'Draft';
//     S @title: 'Submitted';
//     A @title: 'Approved';
//     R @title: 'Rejected';
// }

entity Employees {
    key ID: UUID;
    firstName: String(50);
    lastName: String(50);
    email: String(255);
    department: String(100);

    loans: Composition of many LoanApplications
            on loans.employee = $self;
}

entity LoanStatuses {
    key code : String(1);
        text : String(50);
}

entity LoanApplications {
    key ID: UUID;
    amount: Decimal(15,2);
    currency: String(3);
    purpose: String(255);
    submittedAt: Timestamp;

    status: Association to one LoanStatuses;
    employee: Association to one Employees;


}