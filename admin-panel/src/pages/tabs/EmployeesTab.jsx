import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function EmployeesTab() {
  const { attendance, changingEmployeePassword, closeEmployeeDetails, createEmployeeMessage, creatingEmployee, employeeCreateForm, employeeEditForm, employeeEditMessage, employeePasswordForm, employeePasswordMessage, employees, fetchEmployees, formatDateTime, handleChangeEmployeePassword, handleCreateEmployee, handleRemoveEmployee, handleSaveEmployeeDetails, loadingEmployees, openEmployeeDocuments, savingEmployeeDetails, selectedEmployeeDetails, setCreateEmployeeMessage, setEmployeeCreateForm, setEmployeeEditForm, setEmployeeEditMessage, setEmployeePasswordForm, setEmployeePasswordMessage, setSelectedEmployeeDetails, setShowCreateEmployeeForm, showCreateEmployeeForm } = useAdminPanelContext()

  return (
      <div className="attendance-section">
        <div className="section-header">
          <h2 className="section-title">Employees</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowCreateEmployeeForm((v) => !v)
                setCreateEmployeeMessage({ type: '', text: '' })
              }}
            >
              {showCreateEmployeeForm ? 'Close' : 'Create Employee'}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={fetchEmployees}
              disabled={loadingEmployees}
            >
              {loadingEmployees ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        {selectedEmployeeDetails ? (
          <div style={{ marginTop: '14px', backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px' }}>{selectedEmployeeDetails.name || 'Employee'}</h3>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Employee ID: {selectedEmployeeDetails.employeeId || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleRemoveEmployee(selectedEmployeeDetails)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Remove employee
                </button>
                <button type="button" className="secondary-button" onClick={closeEmployeeDetails}>Back to list</button>
              </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Documents</div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>{selectedEmployeeDetails.documentsUploaded ? 'Uploaded' : 'Not uploaded'}</div>
                {selectedEmployeeDetails.documentsUploaded ? (
                  <button type="button" onClick={() => openEmployeeDocuments(selectedEmployeeDetails)} style={{ marginTop: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#2F8CF4', color: '#fff', border: 'none', borderRadius: '6px' }}>View documents</button>
                ) : null}
              </div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Created At</div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>{formatDateTime(selectedEmployeeDetails.createdAt)}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Updated At</div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>{formatDateTime(selectedEmployeeDetails.updatedAt)}</div>
              </div>
            </div>


            <form onSubmit={handleSaveEmployeeDetails} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, marginBottom: '10px' }}>Edit employee details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <input type="text" placeholder="Name" value={employeeEditForm.name} onChange={(e) => setEmployeeEditForm((p) => ({ ...p, name: e.target.value }))} style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} required />
                <input type="text" placeholder="Phone Number" value={employeeEditForm.phone} onChange={(e) => setEmployeeEditForm((p) => ({ ...p, phone: e.target.value }))} style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} required />
                <select value={employeeEditForm.isActive ? 'active' : 'inactive'} onChange={(e) => setEmployeeEditForm((p) => ({ ...p, isActive: e.target.value === 'active' }))} style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <textarea placeholder="Address" value={employeeEditForm.address} onChange={(e) => setEmployeeEditForm((p) => ({ ...p, address: e.target.value }))} rows={3} style={{ marginTop: '10px', width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', resize: 'vertical' }} required />
              {employeeEditMessage.text ? (
                <div style={{ marginTop: '10px', color: employeeEditMessage.type === 'error' ? '#B91C1C' : '#166534', fontSize: '13px', fontWeight: 600 }}>
                  {employeeEditMessage.text}
                </div>
              ) : null}
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="submit-button" disabled={savingEmployeeDetails}>
                  {savingEmployeeDetails ? 'Saving...' : 'Save details'}
                </button>
              </div>
            </form>


            <form onSubmit={handleChangeEmployeePassword} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Reset password</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
                Admin can directly set a new password for this employee account.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <input type="password" placeholder="New Password" value={employeePasswordForm.newPassword} onChange={(e) => setEmployeePasswordForm((p) => ({ ...p, newPassword: e.target.value }))} style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} required />
              </div>
              {employeePasswordMessage.text ? (
                <div style={{ marginTop: '10px', color: employeePasswordMessage.type === 'error' ? '#B91C1C' : '#166534', fontSize: '13px', fontWeight: 600 }}>
                  {employeePasswordMessage.text}
                </div>
              ) : null}
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="submit-button" disabled={changingEmployeePassword}>
                  {changingEmployeePassword ? 'Updating...' : 'Reset password'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {showCreateEmployeeForm && (
              <form onSubmit={handleCreateEmployee} style={{ marginTop: '14px', marginBottom: '16px', padding: '14px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#fff' }}>
                <div style={{ marginBottom: '10px', fontSize: '12px', color: '#4B5563' }}>
                  Employee ID is auto-generated (for example: WOOSHER01).
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={employeeCreateForm.name}
                    onChange={(e) => setEmployeeCreateForm((p) => ({ ...p, name: e.target.value }))}
                    style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={employeeCreateForm.phone}
                    onChange={(e) => setEmployeeCreateForm((p) => ({ ...p, phone: e.target.value }))}
                    style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={employeeCreateForm.password}
                    onChange={(e) => setEmployeeCreateForm((p) => ({ ...p, password: e.target.value }))}
                    style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    required
                  />
                </div>
                <textarea
                  placeholder="Address"
                  value={employeeCreateForm.address}
                  onChange={(e) => setEmployeeCreateForm((p) => ({ ...p, address: e.target.value }))}
                  rows={3}
                  style={{ marginTop: '10px', width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', resize: 'vertical' }}
                  required
                />
                {createEmployeeMessage.text && (
                  <div style={{ marginTop: '10px', color: createEmployeeMessage.type === 'error' ? '#B91C1C' : '#166534', fontSize: '13px', fontWeight: 600 }}>
                    {createEmployeeMessage.text}
                  </div>
                )}
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="submit-button" disabled={creatingEmployee}>
                    {creatingEmployee ? 'Creating...' : 'Create Employee'}
                  </button>
                </div>
              </form>
            )}
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Employee ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Address</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Documents</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingEmployees ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Loading employees...</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>No employees found.</td></tr>
                  ) : employees.map((emp) => {
                    const docsUploaded = !!emp.documentsUploaded
                    return (
                      <tr key={emp.employeeId || emp._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{emp.employeeId}</td>
                        <td style={{ padding: '12px' }}>{emp.name || '—'}</td>
                        <td style={{ padding: '12px' }}>{emp.phone || '—'}</td>
                        <td style={{ padding: '12px' }}>{emp.address || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          {docsUploaded ? (
                            <>
                              <span style={{ marginRight: '8px', fontSize: '12px', color: '#155724' }}>Uploaded</span>
                              <button
                                type="button"
                                onClick={() => openEmployeeDocuments(emp)}
                                style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#2F8CF4', color: '#fff', border: 'none', borderRadius: '6px' }}
                              >
                                View
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>Not uploaded</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmployeeDetails(emp)
                                setEmployeeEditForm({
                                  name: emp?.name || '',
                                  phone: emp?.phone || '',
                                  address: emp?.address || '',
                                  isActive: emp?.isActive !== false,
                                })
                                setEmployeePasswordForm({ newPassword: '' })
                                setEmployeeEditMessage({ type: '', text: '' })
                                setEmployeePasswordMessage({ type: '', text: '' })
                              }}
                              style={{
                                width: '30px',
                                height: '30px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: '#111827',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                              }}
                              aria-label="View employee details"
                              title="View employee details"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveEmployee(emp)}
                              style={{
                                width: '30px',
                                height: '30px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: '#DC2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                              }}
                              aria-label="Remove employee"
                              title="Remove employee"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M3.5 6.5h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8 6.5V5a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0116 5v1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M6.5 6.5l1 13a1.5 1.5 0 001.5 1.4h6a1.5 1.5 0 001.5-1.4l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10 10.5v6M14 10.5v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
  )
}
