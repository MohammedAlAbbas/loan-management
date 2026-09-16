using { loan.management as db } from '../db/schema';

service EmployeeService {

    entity Employees as projection on db.Employees;

    entity LoanApplications as projection on db.LoanApplications;

    action submitLoan(loanID: UUID) returns LoanApplications;

}