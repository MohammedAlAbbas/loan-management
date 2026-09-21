using { loan.management as db } from '../db/schema';

service EmployeeService {

    entity Employees as projection on db.Employees;

    @restrict: [
        {
            grant: 'READ',
            to: ['LoanRequester', 'LoanApprover']
        },
        {
            grant: 'CREATE',
            to: 'LoanRequester'
        },
        {
            grant: 'UPDATE',
            to: 'LoanRequester',
            where: 'employee.userId = $user.id'
        }
    ]
    entity LoanApplications as projection on db.LoanApplications;

    entity LoanStatuses as projection on db.LoanStatuses;

    entity LoanStatusTransitions as projection on db.LoanStatusTransitions;

    entity LoanStatusHistory as projection on db.LoanStatusHistory;

    @restrict: [
        {
            grant: 'EXECUTE',
            to: 'LoanRequester'
        }
    ]
    action submitLoan(loanID: UUID) returns LoanApplications;

    @requires: 'LoanApprover'
    action approveLoan(loanID: UUID) returns LoanApplications;

    action rejectLoan(loanID: UUID) returns LoanApplications;

}