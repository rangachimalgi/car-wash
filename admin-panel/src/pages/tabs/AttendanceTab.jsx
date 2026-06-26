import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function AttendanceTab() {
  const { attendance, attendanceDate, employees, fetchAttendance, formatTime, getAttendanceSummary, loading, loadingAttendance, openEmployeeDocuments, selectedEmployeeId, setAttendanceDate, setSelectedEmployeeId } = useAdminPanelContext()

  return (
      <div className="attendance-section">
        <div className="section-header">
          <h2 className="section-title">Employee Attendance</h2>
          <button
            type="button"
            className="secondary-button"
            onClick={fetchAttendance}
            disabled={loadingAttendance}
          >
            {loadingAttendance ? 'Loading...' : 'Refresh'}
          </button>
        </div>


        {/* Filters */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600' }}>Date:</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600' }}>Employee:</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '200px',
              }}
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.employeeId || emp._id} value={emp.employeeId || emp._id}>
                  {emp.name || emp.employeeId || 'Unknown'} ({emp.employeeId || emp._id})
                </option>
              ))}
            </select>
          </div>
        </div>


        {/* Summary Cards */}
        {(() => {
          const summary = getAttendanceSummary()
          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Employees</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{summary.total}</div>
              </div>
              <div style={{
                padding: '15px',
                backgroundColor: '#d4edda',
                borderRadius: '8px',
                border: '1px solid #c3e6cb'
              }}>
                <div style={{ fontSize: '12px', color: '#155724', marginBottom: '5px' }}>Present</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{summary.present}</div>
              </div>
              <div style={{
                padding: '15px',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                border: '1px solid #f5c6cb'
              }}>
                <div style={{ fontSize: '12px', color: '#721c24', marginBottom: '5px' }}>Absent</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{summary.absent}</div>
              </div>
            </div>
          )
        })()}


        {/* Attendance Table */}
        {loadingAttendance ? (
          <div className="loading-text">Loading attendance...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Employee ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Documents</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
                      No employees found. Please ensure employees are created first.
                    </td>
                  </tr>
                ) : employees.map((employee) => {
                  const attendanceRecord = attendance.find(a => a.employeeId === employee.employeeId)
                  const docsUploaded = !!employee.documentsUploaded
                  return (
                    <tr key={employee.employeeId || employee._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{employee.employeeId}</td>
                      <td style={{ padding: '12px' }}>{employee.name || '—'}</td>
                      <td style={{ padding: '12px' }}>{employee.phone || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        {attendanceRecord?.checkIn ? formatTime(attendanceRecord.checkIn) : '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {attendanceRecord?.checkIn ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#d4edda',
                            color: '#155724',
                          }}>
                            Present
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                          }}>
                            Absent
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {docsUploaded ? (
                          <>
                            <span style={{ marginRight: '8px', fontSize: '12px', color: '#155724' }}>Uploaded</span>
                            <button
                              type="button"
                              onClick={() => openEmployeeDocuments(employee)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: '#2F8CF4',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                              }}
                            >
                              View
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>Not uploaded</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}


      </div>
  )
}
