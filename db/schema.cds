namespace loan.management;

entity Employees {
    key ID: UUID;
    firstName: String(50);
    lastName: String(50);
    email: String(255);
    department: String(100);

    loans: Composition of many LoanApplications
            on loans.employee = $self;
}

entity LoanApplications {
    key ID: UUID;
    amount: Decimal(15,2);
    currency: String(3);
    purpose: String(255);
    status: String(20);
    submittedAt: Timestamp;

    employee: Association to one Employees;

}